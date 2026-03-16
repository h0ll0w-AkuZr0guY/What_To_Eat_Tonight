<template>
  <div class="history-container">
    <div class="header">
      <h2>📝 干饭时间线</h2>
      <p class="subtitle">长按卡片可以进行修改或删除</p>
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

// 最新添加的在最上面
const sortedHistory = computed(() => {
  return [...history.value].reverse();
});

// 颜色渐变：越新的记录颜色越深 (鲜活)，越老越淡
const getCardColor = (index, total) => {
  // 基础颜色: RGB(76, 175, 80) 绿
  const opacity = Math.max(0.15, 1 - (index / Math.min(total, 30))); 
  return `rgba(76, 175, 80, ${opacity})`;
};

// --- 长按交互逻辑 ---
let pressTimer = null;
const activeEntry = ref(null);

const startPress = (entry) => {
  pressTimer = setTimeout(() => {
    activeEntry.value = entry;
  }, 600); // 长按 600ms 触发
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
      history.value[entryIndex].name = newName.trim();
      localStorage.setItem('food_history', JSON.stringify(history.value));
    }
  }
  activeEntry.value = null;
};
</script>

<style scoped>
.history-container { width: 100%; max-width: 600px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 20px; }
.subtitle { font-size: 12px; color: #888; }

.timeline { display: flex; flex-direction: column; gap: 12px; }
.history-card { 
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-radius: 12px;
  color: #333; font-weight: bold; cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  user-select: none; /* 防止长按选中文本 */
  -webkit-user-select: none;
  transition: transform 0.2s;
}
.history-card:active { transform: scale(0.98); }
.time { font-family: monospace; font-size: 14px; opacity: 0.8; }
.name { font-size: 18px; }

.empty-state { text-align: center; color: #aaa; padding: 40px; }

/* 模态框样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding-bottom: 20px;}
.action-menu { background: white; width: 90%; max-width: 400px; border-radius: 16px; overflow: hidden; animation: slideUp 0.3s ease; }
.menu-title { text-align: center; padding: 15px; margin: 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee; }
.menu-btn { width: 100%; padding: 16px; border: none; border-bottom: 1px solid #eee; background: white; font-size: 16px; font-weight: bold; cursor: pointer; }
.menu-btn.edit { color: #2196F3; }
.menu-btn.delete { color: #F44336; }
.menu-btn.cancel { color: #888; border-bottom: none; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>