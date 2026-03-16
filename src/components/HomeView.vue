<template>
  <div class="home-container">
    <main class="layout-container">
      <section class="card-section wheel-section">
        
        <div class="breadcrumb" v-if="wheelStack.length > 1">
          <button @click="goBack" class="back-btn">⬅ 返回上一级 (当前: {{ currentGroupName }})</button>
        </div>

        <LuckyWheel :items="currentWheelItems" :isSpinning="isSpinning" @spin-end="handleSpinEnd" />
        <p class="status-text">{{ statusText }}</p>
        
        <button class="action-btn spin-btn" :disabled="isSpinning" @click="isSpinning = true">
          {{ wheelStack.length > 1 ? '继续抽取子分类！' : '开始命运的转动！' }}
        </button>

        <div class="tags-filter-box">
          <p class="filter-title">🏷️ 根据标签过滤美食：</p>
          <div class="tags-group">
            <label v-for="tag in allTags" :key="tag" class="tag-label">
              <input type="checkbox" :value="tag" v-model="selectedTags" :disabled="isSpinning">
              <span>{{ tag }}</span>
            </label>
            <div v-if="allTags.length === 0" class="no-tags">当前食谱没有设置标签</div>
          </div>
        </div>
      </section>

      <section class="card-section log-section">
        <h3>📝 最终决策确认</h3>
        <div class="decision-box">
          <label>抽取结果 (也可手动修改)：</label>
          <input type="text" v-model="finalChoice" :disabled="isSpinning" class="full-width-input">
          <button class="action-btn confirm-btn" :disabled="isSpinning || !finalChoice" @click="confirmChoice">
            ✅ 确认并写入干饭日志
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import LuckyWheel from './LuckyWheel.vue';
import { useFoodConfig } from '../composables/useFoodConfig';
import { useWheelAlgorithm } from '../composables/useWheelAlgorithm';

const { allFoods, allAvailableTags } = useFoodConfig();
const { history, calculateDynamicWeights, saveHistory } = useWheelAlgorithm(); // 引入 history

const isSpinning = ref(false);
const statusText = ref("点击下方按钮，把决定权交给命运");
const finalChoice = ref("");
const selectedTags = ref([]);

const rootFoods = computed(() => {
  const allChildIds = new Set();
  allFoods.value.forEach(f => {
    if (f.isGroup && f.childIds) f.childIds.forEach(id => allChildIds.add(id));
  });

  const buildNode = (item) => {
    if (item.isGroup) {
      const children = (item.childIds || [])
        .map(id => allFoods.value.find(f => f.id === id))
        .filter(Boolean)
        .map(child => buildNode(child));
      return { ...item, children };
    }
    return { ...item };
  };

  return allFoods.value.filter(f => !allChildIds.has(f.id)).map(buildNode);
});

const filteredFoods = computed(() => {
  if (selectedTags.value.length === 0) return rootFoods.value;
  const filterNodes = (items) => {
    return items.map(item => {
      if (item.isGroup && item.children) {
        const filteredChildren = filterNodes(item.children);
        if (filteredChildren.length > 0) return { ...item, children: filteredChildren };
      }
      const hasTag = item.tags?.some(tag => selectedTags.value.includes(tag));
      return hasTag ? item : null;
    }).filter(Boolean);
  };
  return filterNodes(rootFoods.value);
});

const allTags = allAvailableTags;
const wheelStack = ref([]);
const currentGroupName = ref("");

// 🌟 核心升级：同时监听 filteredFoods 和 history！只要你记录了日志，转盘数值瞬间计算并刷新！
watch([filteredFoods, history], ([newFoods]) => {
  wheelStack.value = [calculateDynamicWeights(newFoods)];
  currentGroupName.value = ""; // 记录完后自动重置回主转盘
}, { immediate: true, deep: true });

const currentWheelItems = computed(() => wheelStack.value[wheelStack.value.length - 1] || []);

const goBack = () => {
  if (wheelStack.value.length > 1) {
    wheelStack.value.pop();
    currentGroupName.value = "";
    statusText.value = "已返回上一级";
  }
};

const handleSpinEnd = (winner) => {
  isSpinning.value = false;
  if (winner.isGroup) {
    statusText.value = `抽中分组【${winner.name}】，继续抽子项！`;
    currentGroupName.value = winner.name;
    wheelStack.value.push(winner.children); 
  } else {
    statusText.value = `天意选择了：【 ${winner.name} 】！`;
    finalChoice.value = winner.name;
  }
};

const confirmChoice = () => {
  saveHistory(finalChoice.value);
  statusText.value = "已记录！权重已实时更新。";
  finalChoice.value = ""; // 记录完毕后清空输入框
};
</script>

<style scoped>
/* 保持原本样式不变 */
.home-container { width: 100%; }
.layout-container { display: flex; flex-direction: column; gap: 20px; }
@media (min-width: 768px) { .layout-container { flex-direction: row; align-items: flex-start; } .wheel-section { flex: 3; } .log-section { flex: 2; position: sticky; top: 20px; } }
.card-section { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; width: 100%; }
.breadcrumb { width: 100%; margin-bottom: 15px; text-align: left; }
.back-btn { background: #ff9800; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px;}
.status-text { font-size: 16px; font-weight: bold; margin: 15px 0; color: #E91E63; text-align: center; min-height: 24px; }
.action-btn { width: 100%; padding: 14px 20px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.1s; }
.action-btn:active { transform: scale(0.98); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spin-btn { background-color: #4CAF50; color: white; margin-bottom: 25px; }
.confirm-btn { background-color: #2196F3; color: white; margin-top: 15px; }
.tags-filter-box { width: 100%; background: #f8f9fa; border-radius: 10px; padding: 15px; border: 1px solid #eee; }
.filter-title { margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #555; }
.tags-group { display: flex; flex-wrap: wrap; gap: 12px; }
.tag-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
.tag-label input { width: 16px; height: 16px; }
.no-tags { font-size: 12px; color: #999; }
.decision-box { width: 100%; text-align: left; }
.decision-box label { font-size: 14px; font-weight: bold; color: #555; display: block; margin-bottom: 8px;}
.full-width-input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px; }
</style>