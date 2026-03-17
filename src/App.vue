<template>
  <div class="app-root">
    <header class="top-nav">
      <div class="nav-brand">
        <span class="cat-icon">🐈‍⬛</span>
        <span>薛定谔的饭</span>
      </div>
      <nav class="nav-links">
        <button :class="{ active: currentView === 'HomeView' }" @click="currentView = 'HomeView'">🏠</button>
        <button :class="{ active: currentView === 'HistoryView' }" @click="currentView = 'HistoryView'">📝</button>
        <button :class="{ active: currentView === 'ManageView' }" @click="currentView = 'ManageView'">⚙️</button>
        <button class="about-btn" @click="showAboutModal = true">💡</button>
      </nav>
    </header>
    
    <main class="main-content">
      <component :is="viewComponents[currentView]"></component>
    </main>

    <div class="modal-overlay" v-if="showAboutModal" @click.self="showAboutModal = false">
      <div class="about-modal">
        <h3>🐈‍⬛ 关于薛定谔的饭</h3>
        <p>这是一个专为解决“今天吃什么”而生的防连吃智能转盘项目。</p>
        <p>包含了动态衰减算法、多级转盘、持久化标签等功能，完全本地运行，保护隐私。</p>
        
        <div class="github-link">
          <span>作者 GitHub：</span>
          <a href="https://github.com/h0ll0w-AkuZr0guY" target="_blank">@h0ll0w-AkuZr0guY</a>
        </div>
        
        <div class="modal-footer">
          <button class="confirm-btn" @click="showAboutModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import HomeView from './components/HomeView.vue';
import HistoryView from './components/HistoryView.vue';
import ManageView from './components/ManageView.vue';

const currentView = ref('HomeView');
const viewComponents = { HomeView, HistoryView, ManageView };

const showAboutModal = ref(false);
</script>

<style scoped>
.app-root { max-width: 900px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background-color: #f4f6f8; }

.top-nav { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: calc(env(safe-area-inset-top, 20px) + 15px) 20px 15px 20px; 
  background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { display: flex; align-items: center; gap: 6px; font-size: 18px; font-weight: bold; color: #FF5722; }
.cat-icon { font-size: 22px; }

.nav-links { display: flex; gap: 6px; }
.nav-links button { background: #f0f0f0; border: none; padding: 8px 14px; font-size: 15px; border-radius: 20px; cursor: pointer; transition: all 0.2s; }
.nav-links button.active { background: #FF5722; color: white; }
.nav-links button.about-btn { background: #e3f2fd; color: #1565c0; }

.main-content { flex: 1; padding: 20px 15px calc(env(safe-area-inset-bottom, 20px) + 20px); width: 100%; }

/* 关于弹窗样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.about-modal { background: white; width: 100%; max-width: 320px; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: zoomIn 0.2s ease; text-align: center; }
.about-modal h3 { margin-top: 0; margin-bottom: 15px; color: #333; font-size: 18px; }
.about-modal p { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 10px; text-align: justify; }
.github-link { margin: 20px 0; padding: 12px; background: #f9f9f9; border-radius: 8px; font-size: 14px; color: #333;}
.github-link a { color: #2196F3; font-weight: bold; text-decoration: none; }
.modal-footer { margin-top: 20px; }
.confirm-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; background: #FF5722; color: white; }

@keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>