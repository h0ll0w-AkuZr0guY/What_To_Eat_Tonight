<template>
  <div class="manage-container">
    <h2>⚙️ 管理中心</h2>
    <div class="manage-section">
      <h3>重置数据</h3>
      <button class="reset-btn" @click="resetData">🔄 重置所有数据</button>
      <p class="warning-text">注意：此操作将清除所有干饭记录和配置</p>
    </div>
  </div>
</template>

<script setup>
import { DEFAULT_FOODS, DEFAULT_RULES } from '../default-data';

const resetData = () => {
  if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
    localStorage.removeItem('food_history');
    localStorage.removeItem('food_config');
    localStorage.removeItem('wheel_rules');
    alert('数据已重置');
    window.location.reload();
  }
};
</script>

<style scoped>
.manage-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.manage-section {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 10px;
  color: #555;
}

.reset-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.warning-text {
  margin-top: 10px;
  color: #f44336;
  font-size: 14px;
}
</style>