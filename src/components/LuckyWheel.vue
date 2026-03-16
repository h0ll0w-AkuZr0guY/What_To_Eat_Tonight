<template>
  <div class="wheel-container">
    <div class="wheel-wrapper">
      <canvas ref="canvasRef" width="360" height="360" class="responsive-canvas"></canvas>
      <div class="pointer">▼</div>
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
const colors = ["#FF9999", "#99CCFF", "#99FF99", "#FFCC99", "#E6B3FF", "#FFFF99", "#FFB3E6"];
let currentRotation = 0;
let slices = [];

const drawWheel = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  const cx = 180, cy = 180, r = 170;
  
  ctx.clearRect(0, 0, 360, 360);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentRotation);
  ctx.translate(-cx, -cy);

  let totalWeight = props.items.reduce((sum, item) => sum + item.weight, 0);
  let startAngle = 0;
  
  slices = props.items.filter(i => i.weight > 0).map((item, index) => {
    const extent = (item.weight / totalWeight) * (Math.PI * 2);
    const slice = { ...item, start: startAngle, extent, color: colors[index % colors.length] };
    startAngle += extent;
    return slice;
  });

  slices.forEach(slice => {
    // 1. 绘制扇形
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, slice.start, slice.start + slice.extent);
    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "white";
    ctx.stroke();

    // 2. 🌟 放射状排版文字 (沿着半径往外写)
    const midAngle = slice.start + slice.extent / 2;
    ctx.save();
    ctx.translate(cx, cy); // 移动到圆心
    ctx.rotate(midAngle);  // 旋转到该扇形的中心线上
    
    // 计算边缘弧长，决定文字大小（防重叠）
    const arcLength = r * slice.extent;
    const fontSize = Math.max(9, Math.min(14, arcLength / 2.5)); // 字体最小9px，最大14px
    
    // 如果扇形实在太窄（权重极低），就不显示文字避免糊成一团
    if (arcLength > 8) {
      ctx.textAlign = "right"; // 文字右对齐，从外边缘向圆心画
      ctx.fillStyle = "#333";
      ctx.font = `bold ${fontSize}px 'Microsoft YaHei'`;
      
      // 文字过长智能截断
      let displayName = slice.name;
      if (arcLength < 25 && displayName.length > 4) {
        displayName = displayName.substring(0, 3) + '..';
      } else if (displayName.length > 8) {
        displayName = displayName.substring(0, 7) + '..';
      }

      // 将文字画在靠近外边缘的地方 (r - 25)
      ctx.fillText(displayName, r - 25, -4);
      
      ctx.font = `normal ${Math.max(8, fontSize - 2)}px 'Microsoft YaHei'`;
      ctx.fillText(`(w:${slice.weight})`, r - 25, fontSize - 1);
    }
    
    ctx.restore();
  });
  ctx.restore();
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

  const minAngle = winner.start + 0.05;
  const maxAngle = winner.start + winner.extent - 0.05;
  const targetAngle = minAngle + Math.random() * (maxAngle - minAngle);
  const targetOffset = (Math.PI * 1.5) - targetAngle;
  const totalRotation = currentRotation + (Math.PI * 2 * 10) + ((targetOffset - currentRotation) % (Math.PI * 2));

  const startTime = performance.now();
  const startRotation = currentRotation;

  const animate = (time) => {
    const t = Math.min((time - startTime) / 4000, 1);
    currentRotation = startRotation + (totalRotation - startRotation) * (1 - Math.pow(1 - t, 4));
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
watch(() => props.items, () => { drawWheel(); }, { deep: true });
onMounted(drawWheel);
</script>

<style scoped>
.wheel-container { display: flex; justify-content: center; width: 100%; }
.wheel-wrapper { position: relative; width: 100%; max-width: 360px; aspect-ratio: 1 / 1; }
.responsive-canvas { width: 100%; height: auto; display: block; }
.pointer { position: absolute; top: -5%; left: 50%; transform: translateX(-50%); color: #FF3333; font-size: clamp(24px, 8vw, 30px); z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
</style>