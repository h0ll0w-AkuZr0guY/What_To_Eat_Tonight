// src/composables/useWheelAlgorithm.js
import { ref } from 'vue';
import { DEFAULT_RULES } from '../default-data';

export function useWheelAlgorithm() {
  const rules = ref(JSON.parse(localStorage.getItem('wheel_rules')) || DEFAULT_RULES);
  const history = ref(JSON.parse(localStorage.getItem('food_history')) || []);

  const calculateDynamicWeights = (items) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentMonday = new Date(today);
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    currentMonday.setDate(today.getDate() - dayOfWeek);

    // 【升级点】：支持一天多条记录，按数组存储
    const dailyLog = {};
    history.value.forEach(entry => { 
      if (!dailyLog[entry.date]) dailyLog[entry.date] = [];
      dailyLog[entry.date].push(entry.name);
    });

    return items.map(item => {
      let w = Number(item.weight);
      
      if (item.isGroup && item.children) {
        item.children = calculateDynamicWeights(item.children);
      }

      // 1. 奖励机制
      let absentDays = true;
      for(let i = 1; i <= rules.value.rewardThreshold; i++) {
        const dStr = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
        if (dailyLog[dStr] && dailyLog[dStr].includes(item.name)) { 
          absentDays = false; 
          break; 
        }
      }
      if (absentDays && Object.keys(dailyLog).length > 0) w *= rules.value.rewardRate;

      // 2. 衰减惩罚 (本周吃过几次就惩罚几次，支持一日多餐)
      let occurrencesThisWeek = 0;
      let curr = new Date(currentMonday);
      while(curr <= today) {
        const dStr = curr.toISOString().split('T')[0];
        if (dailyLog[dStr]) {
          occurrencesThisWeek += dailyLog[dStr].filter(name => name === item.name).length;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (occurrencesThisWeek > 0) w *= Math.pow(rules.value.punishRate, occurrencesThisWeek);

      // 3. 连续天数防爆肝
      const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
      const dayBeforeStr = new Date(today.getTime() - 86400000 * 2).toISOString().split('T')[0];
      
      const eatenYesterday = dailyLog[yesterdayStr] && dailyLog[yesterdayStr].includes(item.name);
      const eatenDayBefore = dailyLog[dayBeforeStr] && dailyLog[dayBeforeStr].includes(item.name);
      
      if (eatenYesterday && eatenDayBefore && rules.value.banConsecutiveDays <= 2) {
        w = 0;
      }

      return { ...item, weight: Number(w.toFixed(2)) };
    });
  };

  const saveHistory = (selectedName) => {
    const now = new Date();
    // 补齐两位数的时间格式
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    // 【升级点】：不再覆盖今日记录，直接追加，并生成唯一ID
    history.value.push({ 
      id: Date.now(),
      date: dateStr, 
      datetime: `${dateStr}  ${timeStr}`, // 增加了一点点距离
      name: selectedName 
    });
    localStorage.setItem('food_history', JSON.stringify(history.value));
  };

  return { rules, history, calculateDynamicWeights, saveHistory };
}