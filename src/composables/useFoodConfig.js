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

  // 🌟 核心修复：更健壮的移动端分享机制
  const exportData = async () => {
    const data = { foods: globalFoods.value, rules: globalRules.value };
    const jsonStr = JSON.stringify(data, null, 2);

    // 尝试 1：使用原生文本分享 (唤起微信/QQ发送面板)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '薛定谔的饭-食谱配置',
          text: jsonStr
        });
        return; // 分享成功则退出
      } catch (err) {
        console.log("分享被取消或失败，尝试兜底方案", err);
      }
    }

    // 尝试 2：PC端触发文件下载
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `food_config_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // 尝试 3：终极兜底 - 复制到剪贴板
      try {
        await navigator.clipboard.writeText(jsonStr);
        alert("由于环境限制，配置已复制到剪贴板！请直接粘贴发送给好友。");
      } catch (e) {
        alert("导出失败，请检查应用权限。");
      }
    }
  };

  return { allFoods: globalFoods, rules: globalRules, saveFoods, saveRules, allAvailableTags, exportData };
}