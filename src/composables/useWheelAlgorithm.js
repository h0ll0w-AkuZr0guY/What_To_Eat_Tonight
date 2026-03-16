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

    const dailyLog = {};
    history.value.forEach(entry => { 
      if (!dailyLog[entry.date]) dailyLog[entry.date] = [];
      dailyLog[entry.date].push(entry.name);
    });

    // 🌟 核心升级：递归查找法。如果它是群组，只要吃了它的子集，它也要一并受罚！
    const getEatenCount = (item, dateStr) => {
      let count = 0;
      if (dailyLog[dateStr]) {
        // 计算自己被吃的次数
        count += dailyLog[dateStr].filter(name => name === item.name).length;
      }
      // 如果是群组，递归叠加所有子项被吃的次数
      if (item.isGroup && item.children) {
        item.children.forEach(child => {
          count += getEatenCount(child, dateStr);
        });
      }
      return count;
    };

    return items.map(item => {
      let w = Number(item.weight);
      
      // 先计算子项的权重，确保递归到底部
      if (item.isGroup && item.children) {
        item.children = calculateDynamicWeights(item.children);
      }

      // 1. 奖励机制
      let absentDays = true;
      for(let i = 1; i <= rules.value.rewardThreshold; i++) {
        const dStr = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
        if (getEatenCount(item, dStr) > 0) { 
          absentDays = false; 
          break; 
        }
      }
      if (absentDays && Object.keys(dailyLog).length > 0) w *= rules.value.rewardRate;

      // 2. 衰减惩罚 (本周)
      let occurrencesThisWeek = 0;
      let curr = new Date(currentMonday);
      while(curr <= today) {
        const dStr = curr.toISOString().split('T')[0];
        occurrencesThisWeek += getEatenCount(item, dStr);
        curr.setDate(curr.getDate() + 1);
      }
      if (occurrencesThisWeek > 0) w *= Math.pow(rules.value.punishRate, occurrencesThisWeek);

      // 3. 🌟 连吃防爆肝机制 (修复归零逻辑)
      let consecutiveDays = 0;
      // 从昨天开始往前倒推计算连续天数
      for (let i = 1; i <= 30; i++) { 
        const dStr = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
        if (getEatenCount(item, dStr) > 0) {
          consecutiveDays++;
        } else {
          break; // 一旦有一天没吃，连续中断，跳出
        }
      }
      
      // 如果连续吃的天数 >= 设定的拉黑阈值，今天直接踢出转盘
      if (consecutiveDays >= rules.value.banConsecutiveDays) {
        w = 0;
      }

      return { ...item, weight: Number(w.toFixed(2)) };
    });
  };

  const saveHistory = (selectedName) => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    // 🌟 核心升级：重新赋值整个数组，以此触发 Vue 的深度响应式刷新
    history.value = [...history.value, { 
      id: Date.now(),
      date: dateStr, 
      datetime: `${dateStr}  ${timeStr}`,
      name: selectedName 
    }];
    localStorage.setItem('food_history', JSON.stringify(history.value));
  };

  return { rules, history, calculateDynamicWeights, saveHistory };
}