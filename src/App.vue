<template>
  <div class="app-root">
    <header class="top-nav">
      <div class="nav-brand">🍽️ 薛定谔的饭</div>
      <nav class="nav-links">
        <button :class="{ active: currentView === 'HomeView' }" @click="currentView = 'HomeView'">🏠</button>
        <button :class="{ active: currentView === 'HistoryView' }" @click="currentView = 'HistoryView'">📝</button>
        <button :class="{ active: currentView === 'ManageView' }" @click="currentView = 'ManageView'">⚙️</button>
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

<style scoped>
.app-root { max-width: 900px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background-color: #f4f6f8; }

.top-nav { 
  display: flex; justify-content: space-between; align-items: center; 
  /* 🌟 核心修复：自动避开手机状态栏 (刘海屏) */
  padding: calc(env(safe-area-inset-top, 20px) + 15px) 20px 15px 20px; 
  background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { font-size: 18px; font-weight: bold; color: #FF5722; }
.nav-links { display: flex; gap: 8px; }
.nav-links button { background: #f0f0f0; border: none; padding: 8px 16px; font-size: 16px; border-radius: 20px; cursor: pointer; transition: all 0.2s; }
.nav-links button.active { background: #FF5722; color: white; }

.main-content { flex: 1; padding: 20px 15px calc(env(safe-area-inset-bottom, 20px) + 20px); width: 100%; }
</style>