import { ref, computed } from 'vue';
import { DEFAULT_FOODS, DEFAULT_RULES } from '../default-data';

const loadRules = () => {
  const stored = JSON.parse(localStorage.getItem('wheel_rules'));
  if (!stored) return DEFAULT_RULES;
  return {
    cycleMeals: stored.cycleMeals ?? 10,
    banMaxMeals: stored.banMaxMeals ?? stored.banConsecutiveDays ?? 2,
    punishRate: stored.punishRate ?? 0.5,
    rewardMeals: stored.rewardMeals ?? stored.rewardThreshold ?? 7,
    rewardRate: stored.rewardRate ?? 1.5
  };
};

export const globalFoods = ref(JSON.parse(localStorage.getItem('food_config')) || DEFAULT_FOODS);
export const globalRules = ref(loadRules());
export const globalHistory = ref(JSON.parse(localStorage.getItem('food_history')) || []);

export function useFoodConfig() {
  const saveFoods = (newFoods) => {
    globalFoods.value = [...newFoods];
    localStorage.setItem('food_config', JSON.stringify(globalFoods.value));
  };

  const saveRules = (newRules) => {
    globalRules.value = { ...newRules };
    localStorage.setItem('wheel_rules', JSON.stringify(globalRules.value));
  };

  const allAvailableTags = computed(() => {
    const tags = new Set();
    const extractTags = (items) => {
      items.forEach(item => {
        if (item.tags) item.tags.forEach(t => tags.add(t));
        if (item.children) extractTags(item.children);
      });
    };
    extractTags(globalFoods.value);
    return Array.from(tags);
  });

  // 🌟 核心修复：App端唤起原生分享面板
  const exportData = async () => {
    const data = { foods: globalFoods.value, rules: globalRules.value };
    const jsonStr = JSON.stringify(data, null, 2);
    const fileName = `food_config_${new Date().toISOString().slice(0,10)}.json`;
    const file = new File([jsonStr], fileName, { type: 'application/json' });

    if (navigator.share) {
      try {
        await navigator.share({
          title: '薛定谔的饭配置',
          text: '我的食谱与转盘算法配置',
          files: [file]
        });
      } catch (err) {
        console.log("分享被取消或失败", err);
      }
    } else {
      // 兼容 PC 网页端
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return { allFoods: globalFoods, rules: globalRules, saveFoods, saveRules, allAvailableTags, exportData };
}