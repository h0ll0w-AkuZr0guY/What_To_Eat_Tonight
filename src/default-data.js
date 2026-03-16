// src/default-data.js

export const DEFAULT_FOODS = [
  { id: 'item_1', name: "科大食府", weight: 10, isGroup: false, tags: ["南校", "正餐"] },
  { id: 'item_2', name: "二至坊 & 三白馆", weight: 10, isGroup: false, tags: ["南校", "面食"] },
  { id: 'item_3', name: "科大社区食堂", weight: 10, isGroup: false, tags: ["北校", "正餐"] },
  { id: 'item_4', name: "杀猪粉", weight: 10, isGroup: false, tags: ["南校", "粉面"] },
  { id: 'item_5', name: "沙县小吃", weight: 10, isGroup: false, tags: ["北校", "快餐"] },
  
  { id: 'item_6', name: "麦当劳", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
  { id: 'item_7', name: "肯德基", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
  { id: 'item_8', name: "塔斯汀", weight: 10, isGroup: false, tags: ["校外", "快餐"] },

  { 
    id: 'group_1', 
    name: "🎊 吃点好的", 
    weight: 20, 
    isGroup: true, 
    childIds: ['item_6', 'item_7', 'item_8'],
    tags: []
  }
];

// 🌟 全新升级的“按顿数”默认算法规则
export const DEFAULT_RULES = {
  cycleMeals: 10,       // 1. 周期长度：最近 10 顿算一个周期
  banMaxMeals: 2,       // 2. 拉黑阈值：周期内吃满 2 顿，直接踢出转盘
  punishRate: 0.5,      // 3. 惩罚系数：周期内每吃一顿乘一次
  rewardMeals: 7,       // 4. 奖励触发：连续 7 顿没吃到
  rewardRate: 1.5       // 5. 奖励系数：没吃到则翻倍拔高权重
};