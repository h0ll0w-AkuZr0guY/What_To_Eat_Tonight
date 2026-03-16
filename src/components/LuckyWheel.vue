<template>
    <div class="wheel-container">
      <div class="wheel-wrapper">
        <canvas ref="canvasRef" width="360" height="360"></canvas>
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
  
  // 将原版 App.vue 中的 calculateSlices, drawWheel, spinWheel 移到这里...
  // (为了篇幅省略部分Canvas绘图重复代码，逻辑与V4.0一致)
  
  const drawWheel = () => {
    if (!canvasRef.value) return;
    const ctx = canvasRef.value.getContext('2d');
    const cx = 180, cy = 180, r = 170;
    
    ctx.clearRect(0, 0, 360, 360);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentRotation);
    ctx.translate(-cx, -cy);
  
    // 计算和绘制逻辑与之前完全一样...
    let totalWeight = props.items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = 0;
    slices = props.items.filter(i => i.weight > 0).map((item, index) => {
      const extent = (item.weight / totalWeight) * (Math.PI * 2);
      const slice = { ...item, start: startAngle, extent, color: colors[index % colors.length] };
      startAngle += extent;
      return slice;
    });
  
    slices.forEach(slice => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, slice.start, slice.start + slice.extent);
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "white";
      ctx.stroke();
  
      const midAngle = slice.start + slice.extent / 2;
      ctx.save();
      ctx.translate(cx + (r * 0.65) * Math.cos(midAngle), cy + (r * 0.65) * Math.sin(midAngle));
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = "#333";
      ctx.font = "bold 14px 'Microsoft YaHei'";
      ctx.textAlign = "center";
      ctx.fillText(slice.name, 0, -5);
      ctx.font = "12px 'Microsoft YaHei'";
      ctx.fillText(`(w: ${slice.weight})`, 0, 10);
      ctx.restore();
    });
    ctx.restore();
  };
  
  const executeSpin = () => {
    if (slices.length === 0) return;
    
    // 按照权重随机选出 winner
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
        emit('spin-end', winner); // 将抽中的对象抛出给父组件！
      }
    };
    requestAnimationFrame(animate);
  };
  
  watch(() => props.isSpinning, (newVal) => {
    if (newVal) executeSpin();
  });
  
  watch(() => props.items, () => { drawWheel(); }, { deep: true });
  onMounted(drawWheel);
  </script>
  
  <style scoped>
  .wheel-wrapper { position: relative; width: 360px; height: 360px; margin: 0 auto; }
  .pointer { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); color: #FF3333; font-size: 30px; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  </style>