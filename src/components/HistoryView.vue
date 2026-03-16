<template>
  <div class="history-container">
    <h2>📝 干饭日志</h2>
    <div class="history-list">
      <div v-if="history.length === 0" class="empty-history">
        暂无干饭记录，快去转动转盘吧！
      </div>
      <div v-else class="history-items">
        <div v-for="(entry, index) in history" :key="index" class="history-item">
          <span class="history-date">{{ entry.date }}</span>
          <span class="history-name">{{ entry.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const history = ref([]);

onMounted(() => {
  const savedHistory = localStorage.getItem('food_history');
  if (savedHistory) {
    history.value = JSON.parse(savedHistory).reverse();
  }
});
</script>

<style scoped>
.history-container {
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

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-history {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px dashed #ddd;
  font-size: 14px;
}

.history-date {
  color: #888;
}

.history-name {
  font-weight: bold;
  color: #333;
}
</style>