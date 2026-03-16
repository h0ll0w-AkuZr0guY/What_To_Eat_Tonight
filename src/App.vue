<template>
  <div class="app-container">
    <header class="top-nav">
      <div class="nav-brand">🍽️ 薛定谔的饭 v6.0</div>
      <nav class="nav-links">
        <button :class="{ active: currentView === 'HomeView' }" @click="currentView = 'HomeView'">🏠 转盘</button>
        <button :class="{ active: currentView === 'HistoryView' }" @click="currentView = 'HistoryView'">📝 日志</button>
        <button :class="{ active: currentView === 'ManageView' }" @click="currentView = 'ManageView'">⚙️ 管理</button>
      </nav>
    </header>

    <main class="main-content">
      <component :is="viewComponents[currentView]"></component>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import HomeView from './components/HomeView.vue';
import HistoryView from './components/HistoryView.vue';
import ManageView from './components/ManageView.vue';

const currentView = ref('HomeView');
const viewComponents = { HomeView, HistoryView, ManageView };
</script>

<style>
/* 全局基础样式 */
body { margin: 0; background-color: #f4f6f8; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #333; }
.app-container { max-width: 800px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; }

/* 现代化导航栏 */
.top-nav { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 15px 20px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { font-size: 18px; font-weight: bold; color: #FF5722; }
.nav-links { display: flex; gap: 10px; }
.nav-links button { 
  background: transparent; border: none; padding: 8px 12px; font-size: 14px; 
  border-radius: 20px; cursor: pointer; color: #666; transition: all 0.3s;
}
.nav-links button.active { background: #FF5722; color: white; font-weight: bold; }
.nav-links button:hover:not(.active) { background: #ffe0d6; color: #FF5722; }

/* 主内容区 */
.main-content { flex: 1; padding: 20px; overflow-y: auto; }
</style>