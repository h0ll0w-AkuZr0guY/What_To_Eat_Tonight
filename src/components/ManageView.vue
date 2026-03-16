<template>
    <div class="manage-container">
      
      <div class="manage-header">
        <h2>⚙️ 数据管理</h2>
        <div class="top-actions">
          <button class="action-btn add-btn" @click="openModal()">➕ 新增食谱</button>
          <div class="io-group">
            <ImportData @data-parsed="handleImportedData" />
            <button class="action-btn export-btn" @click="exportData">📥 导出配置</button>
          </div>
        </div>
      </div>
  
      <div class="danger-zone">
        <button class="reset-btn" @click="resetData">⚠️ 重置所有数据</button>
        <span class="danger-text">此操作将清空本地缓存并恢复默认食谱</span>
      </div>
  
      <div class="food-grid">
        <div v-for="(food, index) in allFoods" :key="food.id || index" class="food-card">
          <div class="food-info">
            <h3 class="food-name">
              {{ food.name }} 
              <span v-if="food.isGroup" class="group-badge">多级分类</span>
            </h3>
            <p class="food-weight">心中的评分 (权重): {{ food.weight }}</p>
            <div class="food-tags">
              <span v-for="tag in food.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="small-btn edit" @click="openModal(food, index)">✏️</button>
            <button class="small-btn delete" @click="deleteFood(index)">🗑️</button>
          </div>
        </div>
      </div>
  
      <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="modal-content">
          <h3>{{ isEditing ? '✏️ 编辑项目' : '➕ 新增美食' }}</h3>
          
          <div class="form-group">
            <label>美食/分类名称：</label>
            <input type="text" v-model="formData.name" placeholder="例如：金拱门" class="form-input">
          </div>
  
          <div class="form-group">
            <label>心中评分/权重 ({{ formData.weight }}分)：</label>
            <input type="range" min="1" max="100" v-model.number="formData.weight" class="slider-input">
            <p class="help-text">分数越高，转盘上的面积越大</p>
          </div>
  
          <div class="form-group">
            <label>是否作为“多级分类群组”？</label>
            <label class="toggle-label">
              <input type="checkbox" v-model="formData.isGroup">
              <span>开启后，抽中它会展开子菜单继续抽</span>
            </label>
          </div>
  
          <div class="form-group">
            <label>添加标签 (最多10个)：</label>
            
            <div class="quick-tags" v-if="allAvailableTags.length > 0">
              <span 
                v-for="tag in allAvailableTags" :key="tag" 
                class="quick-tag" 
                :class="{ selected: formData.tags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </span>
            </div>
  
            <div class="add-tag-wrapper">
              <input type="text" v-model="newTagInput" placeholder="输入新标签..." @keyup.enter="addNewTag" class="form-input small">
              <button @click="addNewTag" class="action-btn tag-add-btn">添加</button>
            </div>
            
            <div class="current-tags">
              <span v-for="(tag, idx) in formData.tags" :key="idx" class="selected-tag">
                {{ tag }} <span class="remove-tag" @click="formData.tags.splice(idx, 1)">×</span>
              </span>
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
  import { ref, reactive } from 'vue';
  import { useFoodConfig } from '../composables/useFoodConfig';
  import ImportData from './ImportData.vue';
  
  const { allFoods, saveFoods, saveRules, allAvailableTags, exportData } = useFoodConfig();
  
  // --- 导入处理 ---
  const handleImportedData = (data) => {
    if (data.foods && Array.isArray(data.foods)) {
      saveFoods(data.foods);
    }
    if (data.rules) {
      saveRules(data.rules);
    }
    alert("🎉 数据导入并解析成功！");
  };
  
  // --- 危险操作 ---
  const resetData = () => {
    if (confirm('确定要重置所有数据吗？此操作将丢失当前所有设置！')) {
      localStorage.removeItem('food_history');
      localStorage.removeItem('food_config');
      localStorage.removeItem('wheel_rules');
      window.location.reload();
    }
  };
  
  // --- 表单与弹窗状态 ---
  const showModal = ref(false);
  const isEditing = ref(false);
  const editIndex = ref(-1);
  const newTagInput = ref("");
  
  const formData = reactive({ id: '', name: '', weight: 50, tags: [], isGroup: false });
  
  const openModal = (food = null, index = -1) => {
    if (food) {
      isEditing.value = true;
      editIndex.value = index;
      // 深拷贝避免直接污染
      Object.assign(formData, JSON.parse(JSON.stringify(food)));
      if (!formData.tags) formData.tags = [];
    } else {
      isEditing.value = false;
      editIndex.value = -1;
      Object.assign(formData, { id: 'item_' + Date.now(), name: '', weight: 50, tags: [], isGroup: false });
    }
    newTagInput.value = "";
    showModal.value = true;
  };
  
  // --- 标签逻辑 ---
  const toggleTag = (tag) => {
    const idx = formData.tags.indexOf(tag);
    if (idx > -1) {
      formData.tags.splice(idx, 1);
    } else if (formData.tags.length < 10) {
      formData.tags.push(tag);
    } else {
      alert("最多只能选择10个标签！");
    }
  };
  
  const addNewTag = () => {
    const tag = newTagInput.value.trim();
    if (tag && !formData.tags.includes(tag)) {
      if (formData.tags.length < 10) {
        formData.tags.push(tag);
        newTagInput.value = "";
      } else {
        alert("最多只能选择10个标签！");
      }
    }
  };
  
  // --- 保存与删除 ---
  const saveForm = () => {
    if (!formData.name.trim()) return alert("名称不能为空！");
    
    const foodsCopy = [...allFoods.value];
    if (isEditing.value) {
      foodsCopy[editIndex.value] = { ...formData };
    } else {
      foodsCopy.push({ ...formData });
    }
    
    saveFoods(foodsCopy);
    showModal.value = false;
  };
  
  const deleteFood = (index) => {
    if (confirm("确定要删除这项美食吗？")) {
      const foodsCopy = [...allFoods.value];
      foodsCopy.splice(index, 1);
      saveFoods(foodsCopy);
    }
  };
  </script>
  
  <style scoped>
  .manage-container { width: 100%; }
  
  /* 头部响应式布局 */
  .manage-header { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
  .top-actions { display: flex; flex-direction: column; gap: 10px; }
  .io-group { display: flex; gap: 10px; width: 100%; }
  .io-group > * { flex: 1; } /* 导入和导出按钮各占一半 */
  
  @media (min-width: 600px) {
    .manage-header { flex-direction: row; justify-content: space-between; align-items: center; }
    .top-actions { flex-direction: row; width: auto; }
    .io-group { width: auto; }
  }
  
  /* 按钮通用 */
  .action-btn { padding: 10px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; }
  .add-btn { background: #4CAF50; color: white; width: 100%; }
  .export-btn { background: #607d8b; color: white; width: 100%; }
  
  .danger-zone { background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
  .reset-btn { background: #f44336; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  .danger-text { font-size: 12px; color: #d32f2f; }
  
  /* 列表网格 */
  .food-grid { display: grid; gap: 15px; grid-template-columns: 1fr; }
  @media (min-width: 600px) { .food-grid { grid-template-columns: repeat(2, 1fr); } }
  
  .food-card { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: flex-start; }
  .food-info { flex: 1; min-width: 0; /* 允许内部元素截断 */ }
  .food-name { margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px;}
  .group-badge { background: #e3f2fd; color: #1976d2; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
  .food-weight { margin: 0 0 8px 0; font-size: 13px; color: #666; }
  .food-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { font-size: 11px; background: #f5f5f5; border: 1px solid #e0e0e0; padding: 2px 6px; border-radius: 10px; color: #555; }
  
  .card-actions { display: flex; flex-direction: column; gap: 8px; margin-left: 10px; }
  .small-btn { padding: 8px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .edit { background: #e3f2fd; }
  .delete { background: #ffebee; }
  
  /* 模态框流式布局 */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .modal-content { background: white; padding: 20px; border-radius: 12px; width: 100%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
  .modal-content h3 { margin-top: 0; text-align: center; }
  
  .form-group { margin-bottom: 18px; }
  .form-group label { display: block; font-weight: bold; margin-bottom: 8px; font-size: 14px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
  .slider-input { width: 100%; margin: 10px 0; }
  .help-text { font-size: 12px; color: #999; margin: 0; }
  .toggle-label { display: flex; align-items: center; gap: 8px; font-weight: normal !important; }
  
  /* 标签选择区 */
  .quick-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; background: #f9f9f9; padding: 10px; border-radius: 8px;}
  .quick-tag { padding: 4px 12px; background: white; border: 1px solid #ccc; border-radius: 15px; font-size: 12px; cursor: pointer; }
  .quick-tag.selected { background: #e8f5e9; border-color: #4CAF50; color: #2e7d32; }
  
  .add-tag-wrapper { display: flex; gap: 10px; margin-bottom: 10px; }
  .form-input.small { padding: 8px 12px; flex: 1; }
  .tag-add-btn { background: #2196F3; color: white; padding: 8px 16px; }
  
  .current-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .selected-tag { background: #FF5722; color: white; padding: 4px 10px; border-radius: 15px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .remove-tag { cursor: pointer; font-weight: bold; }
  
  .modal-footer { display: flex; justify-content: flex-end; gap: 15px; margin-top: 25px; }
  .cancel-btn { background: #f5f5f5; color: #333; flex: 1; }
  .save-btn { background: #FF5722; color: white; flex: 1; }
  </style>