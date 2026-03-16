// src/composables/useFoodConfig.js
import { ref, computed } from 'vue';
import { DEFAULT_FOODS, DEFAULT_RULES } from '../default-data';

const allFoods = ref(JSON.parse(localStorage.getItem('food_config')) || DEFAULT_FOODS);
const rules = ref(JSON.parse(localStorage.getItem('wheel_rules')) || DEFAULT_RULES);

export function useFoodConfig() {
  const saveFoods = (newFoods) => {
    allFoods.value = newFoods;
    localStorage.setItem('food_config', JSON.stringify(allFoods.value));
  };

  const saveRules = (newRules) => {
    rules.value = newRules;
    localStorage.setItem('wheel_rules', JSON.stringify(rules.value));
  };

  // 提取当前所有存在的标签（去重），用于管理界面的快速选择和首页的过滤
  const allAvailableTags = computed(() => {
    const tags = new Set();
    const extractTags = (items) => {
      items.forEach(item => {
        if (item.tags) item.tags.forEach(t => tags.add(t));
        if (item.children) extractTags(item.children);
      });
    };
    extractTags(allFoods.value);
    return Array.from(tags);
  });

  // 导出配置
  const exportData = () => {
    const data = { foods: allFoods.value, rules: rules.value };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food_config_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { 
    allFoods, 
    rules, 
    saveFoods, 
    saveRules, 
    allAvailableTags, 
    exportData 
  };
}