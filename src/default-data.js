// src/default-data.js

// 1. 食谱数据结构
export const DEFAULT_FOODS = [
  { id: '1', name: "科大食府", weight: 10, isGroup: false, tags: ["南校", "正餐"] },
  { id: '2', name: "二至坊 & 三白馆", weight: 10, isGroup: false, tags: ["南校", "面食"] },
  { id: '3', name: "科大社区食堂", weight: 10, isGroup: false, tags: ["北校", "正餐"] },
  { 
    id: 'group1', 
    name: "🎊 吃点好的 (多级)", 
    weight: 20, 
    isGroup: true, 
    tags: ["校外", "快餐"],
    children: [
      { id: '4', name: "麦当劳", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
      { id: '5', name: "肯德基", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
      { id: '6', name: "塔斯汀", weight: 10, isGroup: false, tags: ["校外", "快餐"] }
    ]
  }
];

// 2. 动态权重算法规则 (方便以后做成可配置/可导入导出)
export const DEFAULT_RULES = {
  punishRate: 0.5,       // 惩罚系数：本周吃过一次，权重 * 0.5
  rewardRate: 1.5,       // 奖励系数：连续N天没吃，权重 * 1.5
  rewardThreshold: 7,    // 奖励阈值：7天
  banConsecutiveDays: 2  // 拉黑阈值：连续吃2天，第3天权重归 0
};