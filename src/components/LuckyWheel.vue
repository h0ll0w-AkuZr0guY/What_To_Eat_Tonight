<template>
  <div class="wheel-container">
    <div class="wheel-wrapper">
      
      <canvas ref="canvasRef" class="responsive-canvas"></canvas>
      
      <div class="pointer-container">
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 52L3.5 22C0.5 16 -1.5 9.5 2.5 4.5C6.5 -0.5 14 0 20 0C26 0 33.5 -0.5 37.5 4.5C41.5 9.5 39.5 16 36.5 22L20 52Z" fill="#FF5722"/>
          <circle cx="20" cy="14" r="6" fill="#FFFFFF"/>
        </svg>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  isSpinning: { type: Boolean, default: false }
});
const emit = defineEmits(['spin-end']);

const canvasRef = ref(null);

// 🌟 现代化高明度、舒适色盘
const colors = [
  "#FF9A9E", "#FECF8C", "#A8E6CF", "#DCD3FF", 
  "#FFD3B6", "#8EE4AF", "#FFAAA5", "#90E0EF",
  "#F8B195", "#C6D8FF", "#FFE699", "#B2EBF2"
];

let currentRotation = 0;
let slices = [];
let dpr = 1;
const baseSize = 400; // 内部基准分辨率，值越大越精细

const setupCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  // 🌟 核心：获取设备像素比，让物理分辨率翻倍以匹配视网膜屏幕
  dpr = window.devicePixelRatio || 1;
  canvas.width = baseSize * dpr;
  canvas.height = baseSize * dpr;
  // CSS 尺寸保持不变，利用缩放实现超清渲染
  canvas.style.width = `100%`;
  canvas.style.maxWidth = `${baseSize}px`;
};

const drawWheel = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  
  const cx = baseSize / 2;
  const cy = baseSize / 2;
  const r = (baseSize / 2) - 15; // 留出边缘空间画阴影
  
  // 重置画布与缩放
  ctx.restore();
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, baseSize, baseSize);

  // 🌟 1. 绘制底层大阴影轮廓
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  // 数据预处理
  let totalWeight = props.items.reduce((sum, item) => sum + item.weight, 0);
  let startAngle = 0;
  slices = props.items.filter(i => i.weight > 0).map((item, index) => {
    const extent = (item.weight / totalWeight) * (Math.PI * 2);
    const slice = { ...item, start: startAngle, extent, color: colors[index % colors.length] };
    startAngle += extent;
    return slice;
  });

  // 🌟 2. 旋转画布，绘制切片
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentRotation);
  ctx.translate(-cx, -cy);

  slices.forEach(slice => {
    // 绘制扇形背景
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, slice.start, slice.start + slice.extent);
    ctx.fillStyle = slice.color;
    ctx.fill();
    
    // 绘制纯白切割线，增加精致感
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // 🌟 3. 智能放射状文字排版
    const midAngle = slice.start + slice.extent / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    
    // 动态计算该切片在靠外侧的弧长，以决定字号
    const arcLength = (r * 0.75) * slice.extent; 
    const fontSize = Math.max(11, Math.min(18, arcLength / 2.5));
    
    // 如果切片没有细到看不见的程度，才渲染文字
    if (arcLength > 12) {
      ctx.textAlign = "right"; 
      ctx.textBaseline = "middle"; // 保证文本基于 Y 轴绝对居中
      
      // 主标题名称
      let displayName = slice.name;
      // 智能截断过长文字
      if (slice.extent < 0.15 && displayName.length > 5) displayName = displayName.substring(0, 4) + '..';
      else if (displayName.length > 8) displayName = displayName.substring(0, 7) + '..';

      ctx.fillStyle = "#333333";
      ctx.font = `bold ${fontSize}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(displayName, r - 30, -6); // 靠右偏移，并稍微上移
      
      // 副标题权重 (稍微小一点，颜色淡一点)
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = `600 ${Math.max(10, fontSize - 4)}px 'PingFang SC', sans-serif`;
      ctx.fillText(`w:${slice.weight}`, r - 30, fontSize - 2); // 下移
    }
    ctx.restore();
  });
  ctx.restore(); // 结束旋转区域

  // 🌟 4. 绘制精致的外边框
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.stroke();

  // 🌟 5. 绘制中心金属质感轴承座
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fill();
  
  ctx.shadowColor = 'transparent'; // 清除阴影防止污染描边
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FF5722';
  ctx.stroke();
};

const executeSpin = () => {
  if (slices.length === 0) return;
  
  const total = slices.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * total;
  let winner = slices[0];
  for (let s of slices) {
    if (random < s.weight) { winner = s; break; }
    random -= s.weight;
  }

  // 计算落点偏移
  const minAngle = winner.start + 0.05;
  const maxAngle = winner.start + winner.extent - 0.05;
  const targetAngle = minAngle + Math.random() * (maxAngle - minAngle);
  const targetOffset = (Math.PI * 1.5) - targetAngle;
  
  // 增加基础圈数为 12 圈，让动画更饱满
  const totalRotation = currentRotation + (Math.PI * 2 * 12) + ((targetOffset - currentRotation) % (Math.PI * 2));

  const startTime = performance.now();
  const startRotation = currentRotation;

  const animate = (time) => {
    // 增加了一点动画时长至 4.5秒，显得更有悬念
    const t = Math.min((time - startTime) / 4500, 1); 
    const easeOut = 1 - Math.pow(1 - t, 4); // 丝滑减速函数
    
    currentRotation = startRotation + (totalRotation - startRotation) * easeOut;
    drawWheel();
    
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation %= (Math.PI * 2);
      emit('spin-end', winner);
    }
  };
  requestAnimationFrame(animate);
};

watch(() => props.isSpinning, (newVal) => { if (newVal) executeSpin(); });

// 当数据发生变化时重绘
watch(() => props.items, () => { drawWheel(); }, { deep: true });

onMounted(() => {
  setupCanvas();
  drawWheel();
});
</script>

<style scoped>
.wheel-container { 
  display: flex; 
  justify-content: center; 
  align-items: center;
  width: 100%; 
  padding: 15px 0;
}

.wheel-wrapper { 
  position: relative; 
  width: 100%; 
  max-width: 400px; 
  aspect-ratio: 1 / 1; 
  display: flex;
  justify-content: center;
}

/* 强制等比缩放响应式 */
.responsive-canvas { 
  width: 100%; 
  height: auto; 
  display: block; 
}

/* 指针绝对居中并带有浮空阴影 */
.pointer-container { 
  position: absolute; 
  top: -20px; 
  left: 50%; 
  transform: translateX(-50%); 
  z-index: 20; 
  filter: drop-shadow(0 6px 8px rgba(0,0,0,0.25)); 
}
</style>