<template>
  <div class="manage-container">
    
    <div class="rules-card">
      <div class="rules-header">
        <h3>🧠 动态权重算法配置</h3>
        <button class="help-btn" @click="showRulesHelp = !showRulesHelp">❓ 规则说明</button>
      </div>
      
      <div class="rules-help" v-if="showRulesHelp">
        <p><b>连吃惩罚：</b>本周吃过一次，选中概率将乘以该系数。越小惩罚越狠。</p>
        <p><b>未吃奖励：</b>连续设定天数未吃，权重将被乘以该系数拔高。</p>
        <p><b>拉黑阈值：</b>连续吃满该天数，今天将被直接踢出转盘(权重强制为0)。</p>
      </div>

      <div class="rules-grid">
        <label>连吃惩罚系数<input type="number" step="0.1" v-model.number="tempRules.punishRate" class="form-input"></label>
        <label>未吃奖励系数<input type="number" step="0.1" v-model.number="tempRules.rewardRate" class="form-input"></label>
        <label>奖励触发(天)<input type="number" v-model.number="tempRules.rewardThreshold" class="form-input"></label>
        <label>拉黑阈值(天)<input type="number" v-model.number="tempRules.banConsecutiveDays" class="form-input"></label>
      </div>
      <button class="action-btn save-rules-btn" @click="saveRules(tempRules); alert('算法参数已更新！')">💾 保存规则</button>
    </div>

    <hr class="divider">

    <div class="manage-header">
      <h2>⚙️ 食谱数据池</h2>
      <div class="top-actions">
        <button class="action-btn add-btn" @click="openModal()">➕ 新增内容</button>
        <div class="io-group">
          <ImportData @data-parsed="handleImportedData" />
          <button class="action-btn export-btn" @click="exportData">📥 导出配置</button>
        </div>
      </div>
    </div>

    <div class="food-grid">
      <div v-for="(food, index) in sortedFoods" :key="food.id" class="food-card" :class="{'is-group-card': food.isGroup}">
        <div class="food-info">
          <h3 class="food-name">
            {{ food.name }} 
            <span v-if="food.isGroup" class="group-badge">🗂️ 层级组</span>
          </h3>
          <p class="food-weight">权重: {{ food.weight }}</p>
          
          <div v-if="!food.isGroup" class="food-tags">
            <span v-for="tag in food.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div v-else class="child-count">
            包含 {{ food.childIds ? food.childIds.length : 0 }} 个子项
          </div>
        </div>
        <div class="card-actions">
          <button class="small-btn edit" @click="openModal(food)">✏️</button>
          <button class="small-btn delete" @click="deleteFood(food.id)">🗑️</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEditing ? '✏️ 编辑内容' : '➕ 新增内容' }}</h3>
        
        <div class="form-group">
          <label>名称：</label>
          <input type="text" v-model="formData.name" placeholder="例如：金拱门 / 聚餐选项" class="form-input">
        </div>

        <div class="form-group">
          <label>权重 ({{ formData.weight }}分)：</label>
          <input type="range" min="1" max="100" v-model.number="formData.weight" class="slider-input">
        </div>

        <div class="form-group type-switch">
          <label class="toggle-label">
            <input type="checkbox" v-model="formData.isGroup">
            <b>作为“多级层级群组”？</b>
          </label>
        </div>

        <div class="form-group" v-if="formData.isGroup">
          <label>包含的食谱 (勾选将放入该组)：</label>
          <div class="child-picker">
            <label v-for="item in nonGroupFoods" :key="item.id" class="child-label">
              <input type="checkbox" :value="item.id" v-model="formData.childIds">
              {{ item.name }}
            </label>
            <p v-if="nonGroupFoods.length===0" class="help-text">你需要先创建一些独立食谱</p>
          </div>
        </div>

        <div class="form-group" v-else>
          <label>标签：</label>
          <div class="quick-tags" v-if="allAvailableTags.length > 0">
            <span v-for="tag in allAvailableTags" :key="tag" class="quick-tag" :class="{ selected: formData.tags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</span>
          </div>
          <div class="add-tag-wrapper">
            <input type="text" v-model="newTagInput" placeholder="新标签..." @keyup.enter="addNewTag" class="form-input small">
            <button @click="addNewTag" class="action-btn tag-add-btn">添加</button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn cancel-btn" @click="showModal = false">取消</button>
          <button class="action-btn save-btn" @click="saveForm">✅ 保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useFoodConfig } from '../composables/useFoodConfig';
import { useWheelAlgorithm } from '../composables/useWheelAlgorithm';
import ImportData from './ImportData.vue';

const { allFoods, saveFoods, saveRules, allAvailableTags, exportData } = useFoodConfig();
const { rules } = useWheelAlgorithm();

// --- 算法配置逻辑 ---
const tempRules = reactive({ ...rules.value });
const showRulesHelp = ref(false);

// --- 扁平列表与排序 ---
// 【升级点】：层级置顶，其余最新在上面
const sortedFoods = computed(() => {
  return [...allFoods.value].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    // 解析时间戳确保最新的排在前面
    const timeA = parseInt(a.id.split('_')[1] || 0);
    const timeB = parseInt(b.id.split('_')[1] || 0);
    return timeB - timeA;
  });
});

const nonGroupFoods = computed(() => allFoods.value.filter(f => !f.isGroup));

// --- 表单与弹窗状态 ---
const showModal = ref(false);
const isEditing = ref(false);
const newTagInput = ref("");

const formData = reactive({ id: '', name: '', weight: 50, tags: [], isGroup: false, childIds: [] });

const openModal = (food = null) => {
  if (food) {
    isEditing.value = true;
    Object.assign(formData, JSON.parse(JSON.stringify(food)));
    if (!formData.tags) formData.tags = [];
    if (!formData.childIds) formData.childIds = [];
  } else {
    isEditing.value = false;
    Object.assign(formData, { id: 'item_' + Date.now(), name: '', weight: 50, tags: [], isGroup: false, childIds: [] });
  }
  newTagInput.value = "";
  showModal.value = true;
};

// ... 此处省略标签切换 (toggleTag/addNewTag) 的重复代码，逻辑与之前一致...
const toggleTag = (t) => { const i = formData.tags.indexOf(t); i > -1 ? formData.tags.splice(i, 1) : formData.tags.push(t); };
const addNewTag = () => { const t = newTagInput.value.trim(); if (t && !formData.tags.includes(t)) formData.tags.push(t); newTagInput.value = ""; };

const saveForm = () => {
  if (!formData.name.trim()) return alert("名称不能为空！");
  const foodsCopy = [...allFoods.value];
  
  if (formData.isGroup) formData.tags = []; // 如果是组，清空标签
  else formData.childIds = []; // 如果是独立项，清空子项引用

  if (isEditing.value) {
    const idx = foodsCopy.findIndex(f => f.id === formData.id);
    if(idx > -1) foodsCopy[idx] = { ...formData };
  } else {
    foodsCopy.push({ ...formData });
  }
  saveFoods(foodsCopy);
  showModal.value = false;
};

const deleteFood = (id) => {
  if (confirm("确定要删除这项内容吗？")) {
    saveFoods(allFoods.value.filter(f => f.id !== id));
  }
};

const handleImportedData = (data) => {
  if (data.foods) saveFoods(data.foods);
  if (data.rules) saveRules(data.rules);
  alert("🎉 数据导入成功！");
};
</script>

<style scoped>
/* 延续基础样式 */
.manage-container { width: 100%; }
.manage-header { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
.top-actions { display: flex; flex-direction: column; gap: 10px; }
.io-group { display: flex; gap: 10px; width: 100%; }
.io-group > * { flex: 1; }
@media (min-width: 600px) { .manage-header { flex-direction: row; justify-content: space-between; align-items: center; } .top-actions { flex-direction: row; width: auto; } .io-group { width: auto; } }

.action-btn { padding: 10px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; }
.add-btn { background: #4CAF50; color: white; width: 100%; }
.export-btn { background: #607d8b; color: white; width: 100%; }

/* 算法规则面板 */
.rules-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.rules-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.rules-header h3 { margin: 0; font-size: 16px; color: #FF5722; }
.help-btn { background: #e3f2fd; color: #1976d2; border: none; padding: 4px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; }
.rules-help { background: #f9f9f9; padding: 10px; border-radius: 8px; font-size: 12px; color: #666; margin-bottom: 15px; }
.rules-help p { margin: 4px 0; }
.rules-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;}
.rules-grid label { font-size: 12px; font-weight: bold; color: #555; }
.save-rules-btn { background: #FF9800; color: white; width: 100%; }
.divider { border: 0; height: 1px; background: #ddd; margin: 25px 0; }

/* 列表展示区 */
.food-grid { display: grid; gap: 15px; grid-template-columns: 1fr; }
@media (min-width: 600px) { .food-grid { grid-template-columns: repeat(2, 1fr); } }
.food-card { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; justify-content: space-between; border-left: 4px solid #4CAF50; }
.is-group-card { border-left-color: #2196F3; background-color: #f8fbff; } /* 组视觉强化 */
.food-name { margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px;}
.group-badge { background: #1976d2; color: white; font-size: 10px; padding: 3px 6px; border-radius: 4px; }
.child-count { font-size: 12px; color: #1976d2; font-weight: bold; }
.food-weight { margin: 0 0 8px 0; font-size: 13px; color: #666; }
.food-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tag { font-size: 11px; background: #f5f5f5; border: 1px solid #e0e0e0; padding: 2px 6px; border-radius: 10px; color: #555; }
.card-actions { display: flex; flex-direction: column; gap: 8px; margin-left: 10px; }
.small-btn { padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.edit { background: #e3f2fd; }
.delete { background: #ffebee; }

/* 表单模态框 (包含新的子项选取) */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; padding: 20px; border-radius: 12px; width: 100%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-weight: bold; margin-bottom: 8px; font-size: 14px; }
.form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-top: 5px;}
.slider-input { width: 100%; margin: 10px 0; }
.type-switch { background: #fff3e0; padding: 10px; border-radius: 8px; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }

/* 选取子项的滚动容器 */
.child-picker { background: #f9f9f9; padding: 10px; border-radius: 8px; max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border: 1px solid #eee; }
.child-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }

.quick-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; background: #f9f9f9; padding: 10px; border-radius: 8px;}
.quick-tag { padding: 4px 12px; background: white; border: 1px solid #ccc; border-radius: 15px; font-size: 12px; cursor: pointer; }
.quick-tag.selected { background: #e8f5e9; border-color: #4CAF50; color: #2e7d32; }
.add-tag-wrapper { display: flex; gap: 10px; margin-bottom: 10px; }
.form-input.small { padding: 8px 12px; flex: 1; margin-top:0;}
.tag-add-btn { background: #2196F3; color: white; padding: 8px 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 15px; margin-top: 25px; }
.cancel-btn { background: #f5f5f5; color: #333; flex: 1; }
.save-btn { background: #FF5722; color: white; flex: 1; }
</style>