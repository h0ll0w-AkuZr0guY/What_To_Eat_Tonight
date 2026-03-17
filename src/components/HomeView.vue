<template>
  <div class="home-container">
    <main class="layout-container">
      <section class="card-section wheel-section">
        <div class="breadcrumb" v-if="wheelStack.length > 1">
          <button @click="goBack" class="back-btn">⬅ 返回上一级 (当前: {{ currentGroupName }})</button>
        </div>
        <LuckyWheel :items="currentWheelItems" :isSpinning="isSpinning" @spin-end="handleSpinEnd" />
        <p class="status-text" :style="{ color: statusColor }">{{ statusText }}</p>
        <button class="action-btn spin-btn" :disabled="isSpinning" @click="isSpinning = true">
          {{ wheelStack.length > 1 ? '继续抽取子分类！' : '开始命运的转动！' }}
        </button>

        <div class="tags-filter-box">
          <p class="filter-title">🏷️ 想吃点啥：</p>
          <div class="tags-group">
            <label v-for="tag in allTags" :key="tag" class="tag-label">
              <input type="checkbox" :value="tag" v-model="selectedTags" :disabled="isSpinning">
              <span>{{ tag }}</span>
            </label>
            <div v-if="allTags.length === 0" class="no-tags">当前食谱没有设置美食标签</div>
          </div>
        </div>
      </section>

      <section class="card-section log-section">
        <h3>📝 最终决策</h3>
        <div class="decision-box">
          <label>今天就决定吃你了！！！</label>
          <input type="text" v-model="finalChoice" :disabled="isSpinning" class="full-width-input" @focus="scrollToInput">
          <button class="action-btn confirm-btn" :disabled="isSpinning || !finalChoice" @click="confirmChoice">
            ✅ 写入干饭日志
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
const { history, rules, calculateDynamicWeights, saveHistory } = useWheelAlgorithm();

const isSpinning = ref(false);
const statusText = ref("点击下方按钮，将决定权交给命运");
const statusColor = ref("#E91E63");
const finalChoice = ref("");
const selectedTags = ref(JSON.parse(localStorage.getItem('selected_tags')) || []);

watch(selectedTags, (newTags) => { localStorage.setItem('selected_tags', JSON.stringify(newTags)); }, { deep: true });

// 🌟 输入法弹出时，延迟 300 毫秒让视图滚动到中央
const scrollToInput = (e) => {
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
};

const rootFoods = computed(() => {
  const allChildIds = new Set();
  allFoods.value.forEach(f => { if (f.isGroup && f.childIds) f.childIds.forEach(id => allChildIds.add(id)); });
  const buildNode = (item) => {
    if (item.isGroup) {
      const children = (item.childIds || []).map(id => allFoods.value.find(f => f.id === id)).filter(Boolean).map(child => buildNode(child));
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
      return item.tags?.some(tag => selectedTags.value.includes(tag)) ? item : null;
    }).filter(Boolean);
  };
  return filterNodes(rootFoods.value);
});

const allTags = allAvailableTags;
const wheelStack = ref([]);
const currentGroupName = ref("");

watch([filteredFoods, history, rules], ([newFoods]) => {
  wheelStack.value = [calculateDynamicWeights(newFoods)];
  currentGroupName.value = ""; 
}, { immediate: true, deep: true });

const currentWheelItems = computed(() => wheelStack.value[wheelStack.value.length - 1] || []);

const goBack = () => { if (wheelStack.value.length > 1) { wheelStack.value.pop(); currentGroupName.value = ""; statusText.value = "已返回上一级"; } };

const handleSpinEnd = (winner) => {
  isSpinning.value = false;
  
  if (winner.isGroup) {
    statusText.value = `🎯 破开结界，进入【${winner.name}】领域，继续深入！`; 
    statusColor.value = "#2196F3"; // 分组统一用科技蓝
    currentGroupName.value = winner.name; 
    wheelStack.value.push(winner.children); 
  } else {
    // 💀 1/1000 概率的隐藏彩蛋：天谴时刻
    if (Math.random() < 0.001) {
      statusText.value = `💀 触发 0.1% 隐藏天谴：老天爷觉得你最近吃太多了，今日【 绝对禁止吃 ${winner.name} 】！给我重抽！`;
      statusColor.value = "#000000"; // 纯黑色警告
      finalChoice.value = ""; // 清空选择，逼迫用户重抽
      return; // 直接打断施法
    }

    // 🤣 随机骚话语录库 (包含 12 种不同的文案和精心配色的马卡龙/鲜艳色调)
    const funPhrases = [
      { text: `就决定是你了，去吧！【 ${winner.name} 】！`, color: '#E91E63' }, // 猛男粉
      { text: `天意难违，老天爷摁着你的头让你吃【 ${winner.name} 】！`, color: '#9C27B0' }, // 基佬紫
      { text: `犹豫就会败北，果断白给，干饭首选【 ${winner.name} 】！`, color: '#3F51B5' }, // 靛蓝色
      { text: `懂了，你的胃正在疯狂呼唤【 ${winner.name} 】！`, color: '#009688' }, // 水鸭绿
      { text: `别纠结了，秦始皇当年扫六合就是为了吃一口【 ${winner.name} 】！`, color: '#D32F2F' }, // 姨妈红
      { text: `算命老爷爷掐指一算，你今日五行缺【 ${winner.name} 】！`, color: '#795548' }, // 泥土棕
      { text: `大数据表明，你现在最适合暴风吸入【 ${winner.name} 】！`, color: '#0288D1' }, // 极客蓝
      { text: `哪怕世界马上毁灭，这顿也必须吃【 ${winner.name} 】！`, color: '#E65100' }, // 亮橙色
      { text: `让开让开，【 ${winner.name} 】闪亮登场，速速干饭！`, color: '#43A047' }, // 原谅绿
      { text: `听我的，不吃【 ${winner.name} 】你今天连睡觉都闭不上眼！`, color: '#607D8B' }, // 蓝灰色
      { text: `抽签结果已出，V我50，这就带你去吃【 ${winner.name} 】！`, color: '#C2185B' }, // 玫瑰红
      { text: `再看一眼，这就是你命中注定的卡路里【 ${winner.name} 】！`, color: '#000000' }  // 高级黑
    ];

    // 随机抽取一句骚话
    const randomIndex = Math.floor(Math.random() * funPhrases.length);
    const selectedResult = funPhrases[randomIndex];

    // 应用文案、颜色和最终结果
    statusText.value = selectedResult.text;
    statusColor.value = selectedResult.color;
    finalChoice.value = winner.name;
  }
};

const confirmChoice = () => { saveHistory(finalChoice.value); statusText.value = "已记录！权重已实时更新。"; finalChoice.value = ""; };
</script>

<style scoped>
/* 保持原有样式不变 */
.home-container { width: 100%; } .layout-container { display: flex; flex-direction: column; gap: 20px; } @media (min-width: 768px) { .layout-container { flex-direction: row; align-items: flex-start; } .wheel-section { flex: 3; } .log-section { flex: 2; position: sticky; top: 20px; } } .card-section { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center; width: 100%; } .breadcrumb { width: 100%; margin-bottom: 15px; text-align: left; } .back-btn { background: #ff9800; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px;} .status-text { font-size: 16px; font-weight: bold; margin: 15px 0; color: #E91E63; text-align: center; min-height: 24px; } .action-btn { width: 100%; padding: 14px 20px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.1s; } .action-btn:active { transform: scale(0.98); } .action-btn:disabled { opacity: 0.5; cursor: not-allowed; } .spin-btn { background-color: #4CAF50; color: white; margin-bottom: 25px; } .confirm-btn { background-color: #2196F3; color: white; margin-top: 15px; } .tags-filter-box { width: 100%; background: #f8f9fa; border-radius: 10px; padding: 15px; border: 1px solid #eee; } .filter-title { margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #555; } .tags-group { display: flex; flex-wrap: wrap; gap: 12px; } .tag-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; } .tag-label input { width: 16px; height: 16px; } .no-tags { font-size: 12px; color: #999; } .decision-box { width: 100%; text-align: left; } .decision-box label { font-size: 14px; font-weight: bold; color: #555; display: block; margin-bottom: 8px;} .full-width-input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px; }
</style>