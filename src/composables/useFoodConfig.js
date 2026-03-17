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

  return { allFoods: globalFoods, rules: globalRules, saveFoods, saveRules, allAvailableTags };
}