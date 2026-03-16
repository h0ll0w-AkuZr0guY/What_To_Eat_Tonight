<template>
  <div class="history-container">
    <div class="header">
      <h2>📝 干饭时间线</h2>
      <p class="subtitle">长按卡片可以进行修改或删除</p>
      
      <button v-if="sortedHistory.length > 0" class="clear-all-btn" @click="clearAllHistory">
        🗑️ 一键清空所有记录
      </button>
    </div>

    <div class="timeline">
      <div v-if="sortedHistory.length === 0" class="empty-state">
        暂无记录，快去干饭吧！
      </div>

      <div 
        v-for="(entry, index) in sortedHistory" 
        :key="entry.id" 
        class="history-card"
        :style="{ background: getCardColor(index, sortedHistory.length) }"
        @touchstart="startPress(entry)"
        @touchend="cancelPress"
        @touchmove="cancelPress"
        @mousedown="startPress(entry)"
        @mouseup="cancelPress"
        @mouseleave="cancelPress"
      >
        <div class="time">{{ entry.datetime }}</div>
        <div class="name">{{ entry.name }}</div>
      </div>
    </div>

    <div class="modal-overlay" v-if="activeEntry" @click.self="activeEntry = null">
      <div class="action-menu">
        <p class="menu-title">操作记录: {{ activeEntry.name }}</p>
        <button class="menu-btn edit" @click="editRecord">✏️ 修改内容</button>
        <button class="menu-btn delete" @click="deleteRecord">🗑️ 删除记录</button>
        <button class="menu-btn cancel" @click="activeEntry = null">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWheelAlgorithm } from '../composables/useWheelAlgorithm';

const { history } = useWheelAlgorithm();

const sortedHistory = computed(() => {
  return [...history.value].reverse();
});

const getCardColor = (index, total) => {
  const opacity = Math.max(0.15, 1 - (index / Math.min(total, 30))); 
  return `rgba(76, 175, 80, ${opacity})`;
};

// --- 新增：一键清空逻辑 ---
const clearAllHistory = () => {
  if (confirm("🚨 警告：确定要清空所有干饭记录吗？此操作不可恢复！")) {
    history.value = [];
    localStorage.setItem('food_history', JSON.stringify([]));
  }
};

// --- 长按交互逻辑 ---
let pressTimer = null;
const activeEntry = ref(null);

const startPress = (entry) => {
  pressTimer = setTimeout(() => {
    activeEntry.value = entry;
  }, 600); 
};

const cancelPress = () => {
  if (pressTimer) clearTimeout(pressTimer);
};

// --- 数据操作 ---
const deleteRecord = () => {
  if (confirm(`确定要删除 [${activeEntry.value.name}] 吗？`)) {
    history.value = history.value.filter(e => e.id !== activeEntry.value.id);
    localStorage.setItem('food_history', JSON.stringify(history.value));
    activeEntry.value = null;
  }
};

const editRecord = () => {
  const newName = prompt("请输入修改后的内容：", activeEntry.value.name);
  if (newName && newName.trim() !== "") {
    const entryIndex = history.value.findIndex(e => e.id === activeEntry.value.id);
    if (entryIndex > -1) {
      // 创建新对象以触发 Vue 的响应式更新
      const newHistory = [...history.value];
      newHistory[entryIndex].name = newName.trim();
      history.value = newHistory;
      localStorage.setItem('food_history', JSON.stringify(history.value));
    }
  }
  activeEntry.value = null;
};
</script>

<style scoped>
.history-container { width: 100%; max-width: 600px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 20px; }
.subtitle { font-size: 12px; color: #888; margin-bottom: 15px; }

/* 一键清空按钮样式 */
.clear-all-btn {
  background-color: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 10px;
}
.clear-all-btn:active { transform: scale(0.95); background-color: #ffcdd2; }

.timeline { display: flex; flex-direction: column; gap: 12px; }
.history-card { 
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-radius: 12px;
  color: #333; font-weight: bold; cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  user-select: none; 
  -webkit-user-select: none;
  transition: transform 0.2s;
}
.history-card:active { transform: scale(0.98); }
.time { font-family: monospace; font-size: 14px; opacity: 0.8; }
.name { font-size: 18px; }

.empty-state { text-align: center; color: #aaa; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding-bottom: 20px;}
.action-menu { background: white; width: 90%; max-width: 400px; border-radius: 16px; overflow: hidden; animation: slideUp 0.3s ease; }
.menu-title { text-align: center; padding: 15px; margin: 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee; }
.menu-btn { width: 100%; padding: 16px; border: none; border-bottom: 1px solid #eee; background: white; font-size: 16px; font-weight: bold; cursor: pointer; }
.menu-btn.edit { color: #2196F3; }
.menu-btn.delete { color: #F44336; }
.menu-btn.cancel { color: #888; border-bottom: none; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>