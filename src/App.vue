<template>
  <div class="app-container">
    <header>
      <h1>命运转盘</h1>
    </header>

    <main class="layout-container">
      
      <section class="wheel-section">
        <div class="wheel-wrapper">
          <canvas ref="canvasRef" width="360" height="360"></canvas>
          <div class="pointer">▼</div>
        </div>
        <p class="status-text" :class="{ 'highlight': isSpinning }">{{ statusText }}</p>
        <button class="spin-btn" :disabled="isSpinning" @click="spinWheel">
          开始命运的转动！
        </button>
      </section>

      <section class="log-section">
        <h3>📝 干饭日志 & 最终决定</h3>
        
        <div class="log-box">
          <div v-for="(entry, index) in recentHistory" :key="index" class="log-item">
            <span class="date">{{ entry.date }}</span>
            <span class="name">{{ entry.name }}</span>
          </div>
          <div v-if="recentHistory.length === 0" class="empty-log">暂无记录，快去干饭！</div>
        </div>

        <div class="action-box">
          <label>最终决定吃什么？</label>
          <select v-model="selectedChoice" :disabled="isSpinning">
            <option v-for="item in baseItems" :key="item.name" :value="item.name">
              {{ item.name }}
            </option>
          </select>
          <button class="confirm-btn" :disabled="isSpinning || !selectedChoice" @click="saveChoice">
            ✅ 确认并写入日志
          </button>
        </div>
      </section>
      
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// === 1. 基础配置 ===
const baseItems = [
  { name: "科大食府", weight: 10 },
  { name: "二至坊&三白馆", weight: 10 },
  { name: "MC", weight: 15 },
  { name: "科大社区食堂", weight: 10 },
  { name: "杀猪粉", weight: 10 },
  { name: "沙县小吃", weight: 10 }
]
const colors = ["#FF9999", "#99CCFF", "#99FF99", "#FFCC99", "#E6B3FF", "#FFFF99", "#FFB3E6"]

// === 2. 状态管理 ===
const history = ref(JSON.parse(localStorage.getItem('food_history')) || [])
const currentItems = ref([])
const slices = ref([])
const isSpinning = ref(false)
const statusText = ref("点击下方按钮，把决定权交给命运")
const selectedChoice = ref(baseItems[0].name)
const canvasRef = ref(null)
let currentRotation = 0 // 当前转盘角度

const recentHistory = computed(() => history.value.slice(-15).reverse())

// === 3. 核心智能权重逻辑 (完美复刻 Python 3.0 版本) ===
const refreshWheelData = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const currentMonday = new Date(today)
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // 0是周一
  currentMonday.setDate(today.getDate() - dayOfWeek)

  const dailyLog = {}
  history.value.forEach(entry => { dailyLog[entry.date] = entry.name })

  const tempItems = []
  baseItems.forEach(item => {
    let w = item.weight
    let absent7Days = true
    
    // 连续7天未吃奖励
    for(let i=1; i<=7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      if (dailyLog[dStr] === item.name) {
        absent7Days = false
        break
      }
    }
    if (absent7Days && Object.keys(dailyLog).length > 0) w *= 1.5

    // 本周衰减惩罚
    let occurrencesThisWeek = 0
    let curr = new Date(currentMonday)
    while(curr <= today) {
      if (dailyLog[curr.toISOString().split('T')[0]] === item.name) occurrencesThisWeek++
      curr.setDate(curr.getDate() + 1)
    }
    if (occurrencesThisWeek > 0) w *= Math.pow(0.5, occurrencesThisWeek)

    // 连续两天防爆肝 (归零)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2)
    if (dailyLog[yesterday.toISOString().split('T')[0]] === item.name && 
        dailyLog[dayBefore.toISOString().split('T')[0]] === item.name) {
      w = 0
    }

    tempItems.push({ ...item, weight: Number(w.toFixed(2)) })
  })

  currentItems.value = tempItems
  calculateSlices()
  drawWheel()
}

// === 4. 转盘绘制逻辑 ===
const calculateSlices = () => {
  let totalWeight = currentItems.value.reduce((sum, item) => sum + item.weight, 0)
  const itemsToUse = totalWeight > 0 ? currentItems.value : baseItems
  totalWeight = itemsToUse.reduce((sum, item) => sum + item.weight, 0)

  let startAngle = 0
  slices.value = itemsToUse.filter(item => item.weight > 0).map((item, index) => {
    const extent = (item.weight / totalWeight) * (Math.PI * 2) // 换成弧度
    const slice = { name: item.name, weight: item.weight, start: startAngle, extent, color: colors[index % colors.length] }
    startAngle += extent
    return slice
  })
}

const drawWheel = () => {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  const cx = 180, cy = 180, r = 170
  
  ctx.clearRect(0, 0, 360, 360)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(currentRotation) // 旋转整个画布
  ctx.translate(-cx, -cy)

  slices.value.forEach(slice => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, slice.start, slice.start + slice.extent)
    ctx.fillStyle = slice.color
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = "white"
    ctx.stroke()

    // 绘制文字
    const midAngle = slice.start + slice.extent / 2
    const textX = cx + (r * 0.65) * Math.cos(midAngle)
    const textY = cy + (r * 0.65) * Math.sin(midAngle)
    
    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate(midAngle + Math.PI / 2) // 让文字朝向圆心
    ctx.fillStyle = "#333"
    ctx.font = "bold 14px 'Microsoft YaHei'"
    ctx.textAlign = "center"
    ctx.fillText(slice.name, 0, -5)
    ctx.font = "12px 'Microsoft YaHei'"
    ctx.fillText(`(w: ${slice.weight})`, 0, 10)
    ctx.restore()
  })
  ctx.restore()
}

// === 5. 动画与抽签核心 ===
const weightedRandom = (items) => {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let random = Math.random() * total
  for (let item of items) {
    if (random < item.weight) return item.name
    random -= item.weight
  }
  return items[0].name
}

const spinWheel = () => {
  if (slices.value.length === 0) return
  isSpinning.value = true
  statusText.value = "命运转动中..."

  const winnerName = weightedRandom(slices.value)
  const winnerSlice = slices.value.find(s => s.name === winnerName)

  // 计算落点 (让指针落在抽中扇形的随机位置)
  const minAngle = winnerSlice.start + 0.05
  const maxAngle = winnerSlice.start + winnerSlice.extent - 0.05
  const targetAngle = minAngle + Math.random() * (maxAngle - minAngle)
  
  // 指针在正上方 (-PI/2)，计算需要的偏移
  const targetOffset = (Math.PI * 1.5) - targetAngle
  
  // 基础多转 10 圈
  const totalRotation = currentRotation + (Math.PI * 2 * 10) + ((targetOffset - currentRotation) % (Math.PI * 2))

  // 动画缓动 (Ease-out)
  const duration = 4000
  const startRotation = currentRotation
  const startTime = performance.now()

  const animate = (time) => {
    const elapsed = time - startTime
    const t = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - t, 4) // 缓动函数
    
    currentRotation = startRotation + (totalRotation - startRotation) * easeOut
    drawWheel()

    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      currentRotation = currentRotation % (Math.PI * 2) // 防止数值过大
      isSpinning.value = false
      statusText.value = `天意选择了：【 ${winnerName} 】！`
      selectedChoice.value = winnerName
    }
  }
  requestAnimationFrame(animate)
}

// === 6. 日志保存 ===
const saveChoice = () => {
  const todayStr = new Date().toISOString().split('T')[0]
  // 覆盖今日记录
  history.value = history.value.filter(entry => entry.date !== todayStr)
  history.value.push({ date: todayStr, name: selectedChoice.value })
  
  localStorage.setItem('food_history', JSON.stringify(history.value))
  statusText.value = `已记录今日干饭：${selectedChoice.value}！`
  
  refreshWheelData()
}

onMounted(() => {
  refreshWheelData()
})
</script>

<style>
/* 响应式魔法写在这里 */
body { margin: 0; background-color: #f0f2f5; font-family: 'Microsoft YaHei', sans-serif; }
.app-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
header { text-align: center; margin-bottom: 20px; color: #333; }

/* 核心布局：手机默认纵向，靠 @media 实现电脑横向 */
.layout-container {
  display: flex;
  flex-direction: column; /* 手机端上下布局 */
  gap: 30px;
}

@media (min-width: 768px) {
  .layout-container {
    flex-direction: row; /* PC端左右布局 */
    align-items: flex-start;
  }
  .wheel-section { flex: 3; }
  .log-section { flex: 2; position: sticky; top: 20px; }
}

/* 组件样式 */
.wheel-section { text-align: center; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.wheel-wrapper { position: relative; width: 360px; height: 360px; margin: 0 auto 20px; }
.pointer { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); color: #FF3333; font-size: 30px; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.status-text { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #555; transition: color 0.3s; }
.status-text.highlight { color: #2196F3; }

button { padding: 12px 24px; font-size: 16px; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.1s, opacity 0.3s; }
button:active { transform: scale(0.95); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.spin-btn { background-color: #4CAF50; color: white; width: 80%; max-width: 300px; }
.confirm-btn { background-color: #2196F3; color: white; width: 100%; margin-top: 10px; }

.log-section { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.log-box { background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; height: 200px; overflow-y: auto; padding: 10px; margin-bottom: 20px; }
.log-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px dashed #ddd; font-size: 14px; }
.log-item .date { color: #888; }
.log-item .name { font-weight: bold; color: #333; }
.empty-log { text-align: center; color: #999; margin-top: 80px; }

.action-box { display: flex; flex-direction: column; gap: 8px; }
select { padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 16px; outline: none; }
</style>