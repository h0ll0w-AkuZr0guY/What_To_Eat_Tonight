<template>
  <div class="home-container">
    <header>
      <h1>命运转盘 v5.0 (组件化 & 多级架构)</h1>
    </header>

    <main class="layout-container">
      <section class="wheel-section">
        
        <div class="tags-filter">
          <span>过滤标签: </span>
          <label v-for="tag in allTags" :key="tag">
            <input type="checkbox" :value="tag" v-model="selectedTags">
            {{ tag }}
          </label>
        </div>

        <div class="breadcrumb" v-if="wheelStack.length > 1">
          <button @click="goBack" class="back-btn">⬅ 返回上一级 (当前: {{ currentGroupName }})</button>
        </div>

        <LuckyWheel 
          :items="currentWheelItems" 
          :isSpinning="isSpinning"
          @spin-end="handleSpinEnd" 
        />
        
        <p class="status-text">{{ statusText }}</p>
        
        <button class="spin-btn" :disabled="isSpinning" @click="isSpinning = true">
          {{ wheelStack.length > 1 ? '开始抽取子分类！' : '开始命运的转动！' }}
        </button>
      </section>

      <section class="log-section">
        <h3>📝 操作区</h3>
        <button class="export-btn" @click="exportData">📥 导出食谱与规则</button>
        
        <div style="margin-top: 20px;">
          <label>最终决定：</label>
          <input type="text" v-model="finalChoice" disabled style="width: 100%; padding: 8px; margin-top: 5px;">
          <button class="confirm-btn" :disabled="isSpinning || !finalChoice" @click="confirmChoice">
            ✅ 确认并写入日志
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import LuckyWheel from './LuckyWheel.vue';
import { DEFAULT_FOODS, DEFAULT_RULES } from '../default-data';
import { useWheelAlgorithm } from '../composables/useWheelAlgorithm';

// --- 状态管理 ---
const allFoods = ref(JSON.parse(localStorage.getItem('food_config')) || DEFAULT_FOODS);
const { calculateDynamicWeights, saveHistory } = useWheelAlgorithm();

const isSpinning = ref(false);
const statusText = ref("点击下方按钮");
const finalChoice = ref("");

// --- 标签过滤逻辑 ---
const allTags = computed(() => {
  const tags = new Set();
  const extractTags = (items) => {
    items.forEach(item => {
      item.tags?.forEach(t => tags.add(t));
      if (item.children) extractTags(item.children);
    });
  };
  extractTags(allFoods.value);
  return Array.from(tags);
});
const selectedTags = ref([]); // 选中的标签（为空代表不过滤）

// 根据标签过滤食谱 (仅保留包含选中标签的项)
const filteredFoods = computed(() => {
  if (selectedTags.value.length === 0) return allFoods.value;
  
  const filterNodes = (items) => {
    return items.map(item => {
      // 如果是组，递归过滤子项
      if (item.isGroup && item.children) {
        const filteredChildren = filterNodes(item.children);
        // 如果子项有符合条件的，保留这个组
        if (filteredChildren.length > 0) return { ...item, children: filteredChildren };
      }
      // 判断自身是否包含任何选中的tag
      const hasTag = item.tags?.some(tag => selectedTags.value.includes(tag));
      return hasTag ? item : null;
    }).filter(Boolean);
  };
  
  return filterNodes(allFoods.value);
});

// --- 多级转盘逻辑 (核心机制) ---
// 我们用一个数组模拟"栈"。栈顶（数组最后一个元素）就是当前转盘要显示的数据列表
const wheelStack = ref([]);
const currentGroupName = ref("");

// 每次过滤条件或基础数据变化，重新计算动态权重并重置栈
watch(filteredFoods, (newFoods) => {
  const weightedFoods = calculateDynamicWeights(newFoods);
  wheelStack.value = [weightedFoods]; // 根层级
}, { immediate: true });

// 当前转盘实际渲染的数据
const currentWheelItems = computed(() => wheelStack.value[wheelStack.value.length - 1] || []);

const goBack = () => {
  if (wheelStack.value.length > 1) {
    wheelStack.value.pop();
    currentGroupName.value = "";
    statusText.value = "已返回上一级";
  }
};

// 监听转盘组件抛出的结果
const handleSpinEnd = (winner) => {
  isSpinning.value = false;
  
  if (winner.isGroup) {
    // 抽中了一个分类（如：吃点好的），将子分类压入栈中，触发二级转盘！
    statusText.value = `抽中了分组【${winner.name}】，请继续抽取具体项！`;
    currentGroupName.value = winner.name;
    // 子项的权重在初始化时已经被 calculateDynamicWeights 处理过了
    wheelStack.value.push(winner.children); 
  } else {
    // 抽中了具体的食物
    statusText.value = `天意选择了：【 ${winner.name} 】！`;
    finalChoice.value = winner.name;
  }
};

// --- 日志与导出 ---
const confirmChoice = () => {
  saveHistory(finalChoice.value);
  statusText.value = "已记录！权重已重新计算。";
  
  // 重新计算权重并重置回最外层转盘
  const weightedFoods = calculateDynamicWeights(filteredFoods.value);
  wheelStack.value = [weightedFoods];
};

const exportData = () => {
  const data = { foods: allFoods.value, rules: DEFAULT_RULES };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wheel_config.json';
  a.click();
};
</script>

<style scoped>
/* 延续之前的样式设计，新增过滤器的样式 */
.home-container {
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

.layout-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

@media (min-width: 768px) {
  .layout-container {
    flex-direction: row;
    align-items: flex-start;
  }
  .wheel-section {
    flex: 3;
  }
  .log-section {
    flex: 2;
    position: sticky;
    top: 20px;
  }
}

.wheel-section, .log-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  text-align: center;
}

/* 标签过滤器样式 */
.tags-filter {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.tags-filter label {
  margin-right: 15px;
  cursor: pointer;
  font-size: 14px;
}

/* 导航返回按钮 */
.breadcrumb {
  margin-bottom: 15px;
}

.back-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin-btn {
  background-color: #4CAF50;
  color: white;
  width: 80%;
  margin-top: 15px;
}

.confirm-btn {
  background-color: #2196F3;
  color: white;
  width: 100%;
  margin-top: 10px;
}

.export-btn {
  background-color: #607d8b;
  color: white;
  width: 100%;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0;
  color: #E91E63;
}
</style>