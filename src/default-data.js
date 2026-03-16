// src/default-data.js

export const DEFAULT_FOODS = [
  // 独立的食谱
  { id: 'item_1', name: "科大食府", weight: 10, isGroup: false, tags: ["南校", "正餐"] },
  { id: 'item_2', name: "二至坊 & 三白馆", weight: 10, isGroup: false, tags: ["南校", "面食"] },
  { id: 'item_3', name: "科大社区食堂", weight: 10, isGroup: false, tags: ["北校", "正餐"] },
  { id: 'item_4', name: "杀猪粉", weight: 10, isGroup: false, tags: ["南校", "粉面"] },
  { id: 'item_5', name: "沙县小吃", weight: 10, isGroup: false, tags: ["北校", "快餐"] },
  
  // 属于某个组的食谱 (它们也是平级的)
  { id: 'item_6', name: "麦当劳", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
  { id: 'item_7', name: "肯德基", weight: 10, isGroup: false, tags: ["校外", "快餐"] },
  { id: 'item_8', name: "塔斯汀", weight: 10, isGroup: false, tags: ["校外", "快餐"] },

  // 层级/群组本身 (通过 childIds 关联上面的食谱)
  { 
    id: 'group_1', 
    name: "🎊 吃点好的", 
    weight: 20, 
    isGroup: true, 
    childIds: ['item_6', 'item_7', 'item_8'],
    tags: [] // 根据你的要求，组的表单里隐藏了标签，所以留空
  }
];

export const DEFAULT_RULES = {
  punishRate: 0.5,       
  rewardRate: 1.5,       
  rewardThreshold: 7,    
  banConsecutiveDays: 2  
};