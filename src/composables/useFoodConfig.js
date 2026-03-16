// src/composables/useFoodConfig.js
import { ref, computed } from 'vue';
import { DEFAULT_FOODS, DEFAULT_RULES } from '../default-data';

// 全局单例状态，保证跨页面数据一致
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

  // 提取当前所有存在的标签（去重）
  const allAvailableTags = computed(() => {
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

  // 导入配置
  const importData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.foods) saveFoods(data.foods);
          if (data.rules) saveRules(data.rules);
          resolve(true);
        } catch (err) {
          reject("文件格式错误，请上传正确的 JSON 文件");
        }
      };
      reader.readAsText(file);
    });
  };

  // 导出配置
  const exportData = () => {
    const data = { foods: allFoods.value, rules: rules.value };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food_config_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { allFoods, rules, saveFoods, saveRules, allAvailableTags, importData, exportData };
}