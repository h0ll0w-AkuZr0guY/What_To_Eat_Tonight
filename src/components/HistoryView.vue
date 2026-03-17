<template>
  <div class="history-container">
    <div class="header">
      <h2>📝 干饭时间线</h2>
      <div class="subtitle-row">
        <p class="subtitle">长按卡片可以进行修改或删除</p>
        <button class="clear-all-btn" v-if="sortedHistory.length > 0" @click="showClearAllModal = true">🗑️ 一键清空</button>
      </div>
    </div>

    <div class="timeline">
      <div v-if="sortedHistory.length === 0" class="empty-state">暂无记录，快去干饭吧！</div>
      <div v-for="(entry, index) in sortedHistory" :key="entry.id" class="history-card" :style="{ background: getCardColor(index, sortedHistory.length) }"
        @touchstart="startPress(entry)" @touchend="cancelPress" @touchmove="cancelPress" @mousedown="startPress(entry)" @mouseup="cancelPress" @mouseleave="cancelPress">
        <div class="time">{{ entry.datetime }}</div>
        <div class="name">{{ entry.name }}</div>
      </div>
    </div>

    <div class="modal-overlay" v-if="activeEntry && !showEditModal && !showDeleteModal && !showClearAllModal" @click.self="activeEntry = null">
      <div class="action-menu">
        <p class="menu-title">操作: {{ activeEntry.name }}</p>
        <button class="menu-btn edit" @click="showEditModal = true">✏️ 修改内容</button>
        <button class="menu-btn delete" @click="showDeleteModal = true">🗑️ 删除记录</button>
        <button class="menu-btn cancel" @click="activeEntry = null">取消</button>
      </div>
    </div>

    <div class="modal-overlay centered" v-if="showEditModal" @click.self="closeModals">
      <div class="nice-modal">
        <h3>✏️ 修改记录</h3>
        <input type="text" v-model="editInputValue" class="modal-input" placeholder="输入新的食物名称">
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModals">取消</button>
          <button class="confirm-btn" @click="confirmEdit">保存修改</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay centered" v-if="showDeleteModal" @click.self="closeModals">
      <div class="nice-modal">
        <h3>🗑️ 确认删除</h3>
        <p>确定要删除 <b>{{ activeEntry?.name }}</b> 的记录吗？此操作无法恢复。</p>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModals">取消</button>
          <button class="danger-btn" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay centered" v-if="showClearAllModal" @click.self="closeModals">
      <div class="nice-modal">
        <h3>🗑️ 清空所有记录</h3>
        <p>确定要清空<b>所有的干饭历史</b>吗？<br>此操作无法恢复，且会重置算法周期惩罚。</p>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModals">取消</button>
          <button class="danger-btn" @click="confirmClearAll">全部清空</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWheelAlgorithm } from '../composables/useWheelAlgorithm';

const { history } = useWheelAlgorithm();
const sortedHistory = computed(() => [...history.value].reverse());
const getCardColor = (index, total) => `rgba(76, 175, 80, ${Math.max(0.15, 1 - (index / Math.min(total, 30)))})`;

let pressTimer = null;
const activeEntry = ref(null);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showClearAllModal = ref(false);
const editInputValue = ref("");

const startPress = (entry) => { pressTimer = setTimeout(() => { activeEntry.value = entry; editInputValue.value = entry.name; }, 500); };
const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };
const closeModals = () => { showEditModal.value = false; showDeleteModal.value = false; showClearAllModal.value = false; activeEntry.value = null; };

const confirmDelete = () => {
  history.value = history.value.filter(e => e.id !== activeEntry.value.id);
  localStorage.setItem('food_history', JSON.stringify(history.value));
  closeModals();
};

const confirmEdit = () => {
  const newName = editInputValue.value.trim();
  if (newName) {
    const entryIndex = history.value.findIndex(e => e.id === activeEntry.value.id);
    if (entryIndex > -1) {
      history.value[entryIndex].name = newName;
      localStorage.setItem('food_history', JSON.stringify(history.value));
      history.value = [...history.value]; 
    }
  }
  closeModals();
};

const confirmClearAll = () => {
  history.value = [];
  localStorage.setItem('food_history', JSON.stringify(history.value));
  closeModals();
};
</script>

<style scoped>
.history-container { width: 100%; max-width: 600px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 20px; } 
.subtitle-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 0 5px; }
.subtitle { font-size: 12px; color: #888; margin: 0; }
.clear-all-btn { background: #ffebee; color: #F44336; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; cursor: pointer; }

.timeline { display: flex; flex-direction: column; gap: 12px; }
.history-card { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-radius: 12px; color: #333; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); user-select: none; -webkit-user-select: none; transition: transform 0.2s; }
.history-card:active { transform: scale(0.98); }
.time { font-family: monospace; font-size: 14px; opacity: 0.8; } .name { font-size: 18px; }
.empty-state { text-align: center; color: #aaa; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding-bottom: 20px;}
.modal-overlay.centered { align-items: center; padding-bottom: 0; }
.action-menu { background: white; width: 90%; max-width: 400px; border-radius: 16px; overflow: hidden; animation: slideUp 0.3s ease; }
.menu-title { text-align: center; padding: 15px; margin: 0; color: #666; font-size: 14px; border-bottom: 1px solid #eee; }
.menu-btn { width: 100%; padding: 16px; border: none; border-bottom: 1px solid #eee; background: white; font-size: 16px; font-weight: bold; cursor: pointer; }
.menu-btn.edit { color: #2196F3; } .menu-btn.delete { color: #F44336; } .menu-btn.cancel { color: #888; border-bottom: none; }

.nice-modal { background: white; width: 90%; max-width: 350px; padding: 20px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: zoomIn 0.2s ease; }
.nice-modal h3 { margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #333; }
.nice-modal p { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; }
.modal-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; margin-bottom: 20px; box-sizing: border-box; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
.modal-footer button { padding: 10px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
.cancel-btn { background: #f0f0f0; color: #555; }
.confirm-btn { background: #2196F3; color: white; }
.danger-btn { background: #F44336; color: white; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>