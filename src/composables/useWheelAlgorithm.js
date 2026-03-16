// src/composables/useWheelAlgorithm.js
import { ref } from 'vue';
import { DEFAULT_RULES } from '../default-data';

export function useWheelAlgorithm() {
  const rules = ref(JSON.parse(localStorage.getItem('wheel_rules')) || DEFAULT_RULES);
  const history = ref(JSON.parse(localStorage.getItem('food_history')) || []);

  // 递归计算权重的函数，支持处理子分类
  const calculateDynamicWeights = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取本周一
    const currentMonday = new Date(today);
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    currentMonday.setDate(today.getDate() - dayOfWeek);

    const dailyLog = {};
    history.value.forEach(entry => { dailyLog[entry.date] = entry.name });

    return items.map(item => {
      let w = item.weight;
      
      // 如果是群组，递归计算其子项的权重，但群组本身的权重也可以根据规则变化
      if (item.isGroup && item.children) {
        item.children = calculateDynamicWeights(item.children);
      }

      // 1. 奖励机制
      let absentDays = true;
      for(let i = 1; i <= rules.value.rewardThreshold; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        if (dailyLog[dStr] === item.name) { absentDays = false; break; }
      }
      if (absentDays && Object.keys(dailyLog).length > 0) w *= rules.value.rewardRate;

      // 2. 衰减惩罚 (本周)
      let occurrencesThisWeek = 0;
      let curr = new Date(currentMonday);
      while(curr <= today) {
        if (dailyLog[curr.toISOString().split('T')[0]] === item.name) occurrencesThisWeek++;
        curr.setDate(curr.getDate() + 1);
      }
      if (occurrencesThisWeek > 0) w *= Math.pow(rules.value.punishRate, occurrencesThisWeek);

      // 3. 连续防爆肝机制
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2);
      if (dailyLog[yesterday.toISOString().split('T')[0]] === item.name && 
          dailyLog[dayBefore.toISOString().split('T')[0]] === item.name) {
        w = 0;
      }

      return { ...item, weight: Number(w.toFixed(2)) };
    });
  };

  const saveHistory = (selectedName) => {
    const todayStr = new Date().toISOString().split('T')[0];
    history.value = history.value.filter(entry => entry.date !== todayStr);
    history.value.push({ date: todayStr, name: selectedName });
    localStorage.setItem('food_history', JSON.stringify(history.value));
  };

  return { rules, history, calculateDynamicWeights, saveHistory };
}