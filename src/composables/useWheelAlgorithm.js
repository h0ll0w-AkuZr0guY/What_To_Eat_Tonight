import { globalRules, globalHistory } from './useFoodConfig';

export function useWheelAlgorithm() {
  
  const matchItem = (item, logName) => {
    if (item.name === logName) return true;
    if (item.isGroup && item.children) {
      return item.children.some(child => matchItem(child, logName));
    }
    return false;
  };

  const calculateDynamicWeights = (items) => {
    const historyNames = globalHistory.value.map(entry => entry.name);
    const R = globalRules.value;

    return items.map(item => {
      let w = Number(item.weight);
      
      if (item.isGroup && item.children) {
        item.children = calculateDynamicWeights(item.children);
      }

      // 1. 获取滑动窗口周期：最近 N 顿
      const recentCycleHistory = historyNames.slice(-R.cycleMeals);
      
      let countInCycle = 0;
      recentCycleHistory.forEach(logName => {
        if (matchItem(item, logName)) countInCycle++;
      });

      // 2. 🚫 拉黑机制
      if (countInCycle >= R.banMaxMeals) {
        w = 0;
      } else {
        // 3. 📉 衰减惩罚
        if (countInCycle > 0) {
          w *= Math.pow(R.punishRate, countInCycle);
        }
      }

      // 4. 🎁 奖励机制 (修复：必须总记录数达到了要求的顿数，才开始发放奖励)
      if (w > 0) {
        const rewardWindowHistory = historyNames.slice(-R.rewardMeals);
        let countInRewardWindow = 0;
        rewardWindowHistory.forEach(logName => {
          if (matchItem(item, logName)) countInRewardWindow++;
        });

        // 【修复点】：historyNames.length >= R.rewardMeals 确保吃够了那么多顿才发奖励
        if (countInRewardWindow === 0 && historyNames.length >= R.rewardMeals) {
          w *= R.rewardRate;
        }
      }

      return { ...item, weight: Number(w.toFixed(2)) };
    });
  };

  const saveHistory = (selectedName) => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    globalHistory.value = [...globalHistory.value, { 
      id: Date.now(),
      date: dateStr, 
      datetime: `${dateStr}  ${timeStr}`,
      name: selectedName 
    }];
    localStorage.setItem('food_history', JSON.stringify(globalHistory.value));
  };

  return { rules: globalRules, history: globalHistory, calculateDynamicWeights, saveHistory };
}