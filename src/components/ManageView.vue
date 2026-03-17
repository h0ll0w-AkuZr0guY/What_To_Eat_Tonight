<template>
  <div class="manage-container">
    
    <details class="modern-details">
      <summary>🧠 动态权重算法配置</summary>
      <div class="details-content">
        <div class="rules-help">
          <p><b>⏱️ 周期管理：</b>仅参考最近 <b>{{ tempRules.cycleMeals }}</b> 顿记录，超出既往不咎。</p>
          <p><b>🚫 拉黑阈值：</b>周期内吃满该顿数，直接踢出转盘(权重变0)。</p>
          <p><b>📉 连吃惩罚：</b>周期内每吃一顿，中签概率就乘此系数，越小惩罚越狠。</p>
          <p><b>🎁 未吃奖励：</b>连续若干顿未抽中，权重将乘此系数拔高。</p>
        </div>

        <div class="rules-grid">
          <label>1. 周期长度(近几顿)<input type="number" v-model.number="tempRules.cycleMeals" class="form-input"></label>
          <label>2. 拉黑阈值(限几顿)<input type="number" v-model.number="tempRules.banMaxMeals" class="form-input"></label>
          <label>3. 连吃惩罚系数<input type="number" step="0.1" v-model.number="tempRules.punishRate" class="form-input"></label>
          <label>4. 未吃奖励系数<input type="number" step="0.1" v-model.number="tempRules.rewardRate" class="form-input"></label>
          <label class="full-width">5. 奖励触发要求 (连续几顿没吃)<input type="number" v-model.number="tempRules.rewardMeals" class="form-input"></label>
        </div>
        <button class="action-btn save-rules-btn" @click="handleSaveRules">💾 保存规则</button>
      </div>
    </details>

    <details class="modern-details" open>
      <summary>⚙️ 食谱数据池 ({{ allFoods.length }})</summary>
      <div class="details-content">
        
        <div class="sleek-toolbar">
          <button class="pill-btn add" @click.prevent="openModal()">➕ 新增</button>
          <div class="toolbar-right">
            <button class="pill-btn sync" @click.prevent="showSyncModal = true">🔄 导入 / 导出</button>
            <button class="pill-btn clear" @click.prevent="showClearConfirmModal = true">🗑️ 清空</button>
          </div>
        </div>

        <div class="food-grid">
          <div v-for="(food, index) in sortedFoods" :key="food.id" class="food-card" :class="{'is-group-card': food.isGroup}">
            <div class="food-info">
              <h3 class="food-name">{{ food.name }} <span v-if="food.isGroup" class="group-badge">🗂️ 层级组</span></h3>
              <p class="food-weight">权重: {{ food.weight }}</p>
              <div v-if="!food.isGroup" class="food-tags"><span v-for="tag in food.tags" :key="tag" class="tag">{{ tag }}</span></div>
              <div v-else class="child-count">包含 {{ food.childIds ? food.childIds.length : 0 }} 个子项</div>
            </div>
            <div class="card-actions">
              <button class="icon-btn edit" @click.prevent="openModal(food)">✏️</button>
              <button class="icon-btn delete" @click.prevent="triggerDelete(food.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </details>

    <ImportExportModal v-if="showSyncModal" @close="showSyncModal = false" @data-parsed="handleImportedData" />

    <div class="modal-overlay" v-if="showDeleteConfirmModal" @click.self="showDeleteConfirmModal = false">
      <div class="nice-modal">
        <h3>🗑️ 确认删除</h3>
        <p>确定要删除这个食谱吗？此操作不可撤销。</p>
        <div class="modal-footer"><button class="cancel-btn" @click="showDeleteConfirmModal = false">取消</button><button class="danger-btn" @click="confirmDeleteFood">确认删除</button></div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showClearConfirmModal" @click.self="showClearConfirmModal = false">
      <div class="nice-modal">
        <h3>🗑️ 确认清空</h3>
        <p>确定要清空<b>所有食谱数据</b>吗？操作不可撤销。</p>
        <div class="modal-footer"><button class="cancel-btn" @click="showClearConfirmModal = false">取消</button><button class="danger-btn" @click="confirmClearAll">确认清空</button></div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-content">
        <h3>{{ isEditing ? '✏️ 编辑内容' : '➕ 新增内容' }}</h3>
        <div class="form-group"><label>名称：</label><input type="text" v-model="formData.name" placeholder="例如：金拱门" class="form-input"></div>
        <div class="form-group"><label>权重 ({{ formData.weight }}分)：</label><input type="range" min="1" max="100" v-model.number="formData.weight" class="slider-input"></div>
        <div class="form-group type-switch"><label class="toggle-label"><input type="checkbox" v-model="formData.isGroup"><b>作为多级群组？</b></label></div>

        <div class="form-group" v-if="formData.isGroup">
          <label>包含的食谱：</label>
          <div class="child-picker">
            <label v-for="item in nonGroupFoods" :key="item.id" class="child-label"><input type="checkbox" :value="item.id" v-model="formData.childIds">{{ item.name }}</label>
            <p v-if="nonGroupFoods.length===0" class="help-text">请先创建独立食谱</p>
          </div>
        </div>

        <div class="form-group" v-else>
          <label>标签：</label>
          <div class="quick-tags" v-if="displayTags.length > 0">
            <span v-for="tag in displayTags" :key="tag" class="quick-tag" :class="{ selected: formData.tags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</span>
          </div>
          <div class="add-tag-wrapper">
            <input type="text" v-model="newTagInput" placeholder="输入回车添加" @keyup.enter="addNewTag" class="form-input small">
            <button @click="addNewTag" class="action-btn tag-add-btn">添加</button>
          </div>
        </div>

        <div class="modal-footer"><button class="cancel-btn" @click="showModal = false">取消</button><button class="confirm-btn" @click="saveForm">保存</button></div>
      </div>
    </div>

    <div class="toast-notification" v-if="toastMsg">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useFoodConfig } from '../composables/useFoodConfig';
import ImportExportModal from './ImportExportModal.vue';

const { allFoods, rules, saveFoods, saveRules, allAvailableTags } = useFoodConfig();
const tempRules = reactive({ ...rules.value });

// --- 🌟 自定义提示系统 ---
const toastMsg = ref('');
const showToast = (msg) => {
  toastMsg.value = msg;
  setTimeout(() => toastMsg.value = '', 3000);
};

const handleSaveRules = () => {
  saveRules(tempRules);
  showToast('✅ 算法参数已更新，转盘已同步重算！');
};

const showSyncModal = ref(false);
const showClearConfirmModal = ref(false);
const confirmClearAll = () => { saveFoods([]); showClearConfirmModal.value = false; };

const showDeleteConfirmModal = ref(false);
const itemToDelete = ref(null);
const triggerDelete = (id) => { itemToDelete.value = id; showDeleteConfirmModal.value = true; };
const confirmDeleteFood = () => { if (itemToDelete.value) saveFoods(allFoods.value.filter(f => f.id !== itemToDelete.value)); showDeleteConfirmModal.value = false; itemToDelete.value = null; showToast("✅ 已删除"); };

const sortedFoods = computed(() => {
  return [...allFoods.value].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    return parseInt(b.id.split('_')[1] || 0) - parseInt(a.id.split('_')[1] || 0);
  });
});

const nonGroupFoods = computed(() => allFoods.value.filter(f => !f.isGroup));
const showModal = ref(false);
const isEditing = ref(false);
const newTagInput = ref("");
const formData = reactive({ id: '', name: '', weight: 50, tags: [], isGroup: false, childIds: [] });

const displayTags = computed(() => {
  const set = new Set(allAvailableTags.value);
  formData.tags.forEach(t => set.add(t));
  return Array.from(set);
});

const openModal = (food = null) => {
  if (food) { isEditing.value = true; Object.assign(formData, JSON.parse(JSON.stringify(food))); if (!formData.tags) formData.tags = []; if (!formData.childIds) formData.childIds = []; } 
  else { isEditing.value = false; Object.assign(formData, { id: 'item_' + Date.now(), name: '', weight: 50, tags: [], isGroup: false, childIds: [] }); }
  newTagInput.value = ""; showModal.value = true;
};

const toggleTag = (t) => { const i = formData.tags.indexOf(t); i > -1 ? formData.tags.splice(i, 1) : formData.tags.push(t); };
const addNewTag = () => { 
  const t = newTagInput.value.trim(); 
  if (!t) return;
  if (!formData.tags.includes(t)) {
    if (formData.tags.length < 10) formData.tags.push(t);
    else showToast("⚠️ 最多只能选择 10 个标签！");
  }
  newTagInput.value = ""; 
};

const saveForm = () => {
  if (!formData.name.trim()) return showToast("⚠️ 名称不能为空！");
  const foodsCopy = [...allFoods.value];
  if (formData.isGroup) formData.tags = []; else formData.childIds = [];
  if (isEditing.value) { const idx = foodsCopy.findIndex(f => f.id === formData.id); if(idx > -1) foodsCopy[idx] = { ...formData }; } 
  else { foodsCopy.push({ ...formData }); }
  saveFoods(foodsCopy); showModal.value = false; showToast("✅ 保存成功");
};

const handleImportedData = (data) => { 
  if (data.foods) saveFoods(data.foods); 
  if (data.rules) saveRules(data.rules); 
  showToast("🎉 数据导入成功！"); 
};
</script>

<style scoped>
/* 保持原有 UI 样式不变，新增 Toast 样式即可 */
.manage-container { width: 100%; }
.modern-details { background: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.modern-details summary { padding: 15px 20px; font-size: 16px; font-weight: bold; color: #333; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: #fafafa; border-radius: 12px; transition: background 0.2s; }
.modern-details summary:hover { background: #f0f0f0; }
.modern-details summary::after { content: '▼'; font-size: 12px; color: #888; transition: transform 0.3s; }
.modern-details[open] summary::after { transform: rotate(180deg); }
.modern-details[open] summary { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.details-content { padding: 15px 20px 20px 20px; border-top: 1px solid #eee; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.sleek-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }
.pill-btn { display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
.pill-btn:active { transform: scale(0.95); }
.pill-btn.add { background: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; }
.pill-btn.sync { background: #e3f2fd; color: #1565c0; border-color: #bbdefb; }
.pill-btn.clear { background: #ffebee; color: #c62828; border-color: #ffcdd2; }

.rules-help { background: #fff3e0; padding: 12px; border-radius: 8px; font-size: 13px; color: #e65100; margin-bottom: 15px; border-left: 4px solid #ff9800; }
.rules-help p { margin: 6px 0; } 
.rules-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 15px;}
.rules-grid label { font-size: 12px; font-weight: bold; color: #555; display: flex; flex-direction: column; gap: 4px;}
.rules-grid .full-width { grid-column: span 2; } 
.save-rules-btn { background: #FF9800; color: white; width: 100%; margin-top: 5px; }

.food-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
@media (min-width: 600px) { .food-grid { grid-template-columns: repeat(2, 1fr); } }
.food-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid #eee; display: flex; justify-content: space-between; border-left: 4px solid #4CAF50; }
.is-group-card { border-left-color: #2196F3; background-color: #f8fbff; } 
.food-name { margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px;}
.group-badge { background: #1976d2; color: white; font-size: 10px; padding: 3px 6px; border-radius: 4px; }
.child-count { font-size: 12px; color: #1976d2; font-weight: bold; }
.food-weight { margin: 0 0 8px 0; font-size: 13px; color: #666; } 
.food-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.tag { font-size: 11px; background: #f5f5f5; border: 1px solid #e0e0e0; padding: 2px 8px; border-radius: 12px; color: #555; }
.card-actions { display: flex; flex-direction: column; gap: 8px; margin-left: 10px; }
.icon-btn { padding: 6px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; background: transparent; transition: background 0.2s; } 
.icon-btn.edit:hover { background: #e3f2fd; } 
.icon-btn.delete:hover { background: #ffebee; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; padding: 20px; border-radius: 16px; width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; animation: zoomIn 0.2s ease;}
.nice-modal { background: white; width: 90%; max-width: 320px; padding: 20px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: zoomIn 0.2s ease; }
.nice-modal h3 { margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #333; }
.nice-modal p { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; }

.form-group { margin-bottom: 16px; } 
.form-group label { display: block; font-weight: bold; margin-bottom: 6px; font-size: 13px; color: #444;}
.form-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; margin-top: 4px; box-sizing: border-box; outline: none;}
.form-input:focus { border-color: #FF5722; }
.slider-input { width: 100%; margin: 10px 0; }
.type-switch { background: #f9f9f9; padding: 12px; border-radius: 8px; } .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }

.child-picker { background: #f9f9f9; padding: 10px; border-radius: 8px; max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border: 1px solid #eee; }
.child-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.quick-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; background: #f9f9f9; padding: 10px; border-radius: 8px;}
.quick-tag { padding: 4px 12px; background: white; border: 1px solid #ccc; border-radius: 15px; font-size: 12px; cursor: pointer; border: 1px solid transparent;}
.quick-tag.selected { background: #e8f5e9; border-color: #4CAF50; color: #2e7d32; }
.add-tag-wrapper { display: flex; gap: 8px; margin-bottom: 5px; }
.form-input.small { padding: 8px 12px; flex: 1; margin-top:0;}
.tag-add-btn { background: #2196F3; color: white; padding: 8px 16px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;}

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.modal-footer button { padding: 10px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.cancel-btn { background: #f0f0f0; color: #555; }
.confirm-btn { background: #2196F3; color: white; }
.danger-btn { background: #F44336; color: white; }

.action-btn { padding: 10px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; }

@keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* 🌟 美化 Toast 吐司提示样式 */
.toast-notification {
  position: fixed; top: 40px; left: 50%; transform: translateX(-50%);
  background: rgba(40, 40, 40, 0.95); color: white; padding: 12px 20px;
  border-radius: 30px; font-size: 14px; z-index: 3000; font-weight: bold;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2); white-space: nowrap;
  animation: dropDown 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
}
@keyframes dropDown { from { top: -20px; opacity: 0; } to { top: 40px; opacity: 1; } }
@keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
</style>