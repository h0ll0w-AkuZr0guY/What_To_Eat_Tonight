<template>
  <div class="app-root">
    <header class="top-nav">
      <div class="nav-brand">
        <img src="./assets/WhatToEat.jpeg" alt="Logo" class="app-logo" />
        <span>薛定谔的饭</span>
      </div>
      <nav class="nav-links">
        <button :class="{ active: currentView === 'HomeView' }" @click="currentView = 'HomeView'">🏠</button>
        <button :class="{ active: currentView === 'HistoryView' }" @click="currentView = 'HistoryView'">📝</button>
        <button :class="{ active: currentView === 'ManageView' }" @click="currentView = 'ManageView'">⚙️</button>
        <button class="about-btn" @click="openAboutModal">💡</button>
      </nav>
    </header>
    
    <main class="main-content">
      <component :is="viewComponents[currentView]"></component>
    </main>

    <div class="modal-overlay" v-if="showAboutModal" @click.self="closeAboutModal">
      <div class="about-modal">
        <h3>🐈‍⬛ 关于薛定谔的饭</h3>
        <p>这是一个专为解决“今天吃什么”而生的防连吃智能转盘项目。</p>
        <p>包含了转盘嵌套、标签筛选、不重复吃等功能，完全本地运行，保护隐私。</p>
        
        <div class="github-link">
          <span>作者 GitHub：</span>
          <a href="https://github.com/h0ll0w-AkuZr0guY" target="_blank">@h0ll0w-AkuZr0guY</a>
        </div>

        <button class="donate-toggle-btn" v-if="!showDonate" @click="showDonate = true">
          💪 请作者喝口蛋白粉
        </button>

        <div class="donate-section" v-if="showDonate">
          <p class="donate-tip">
            感谢支持！打赏金额固定为 <b>1元</b><br>
            <span class="small-tip">（长按下方二维码可保存图片至相册）</span>
          </p>
          <div class="qr-codes">
            <div class="qr-item">
              <img src="./assets/wechat.png" alt="微信收款码" class="qr-img" />
              <span class="qr-label wechat-color">微信支付</span>
            </div>
            <div class="qr-item">
              <img src="./assets/alipay.jpg" alt="支付宝收款码" class="qr-img" />
              <span class="qr-label alipay-color">支付宝</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="confirm-btn" @click="closeAboutModal">关闭</button>
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
const showDonate = ref(false); // 控制打赏区域的展开状态

const openAboutModal = () => {
  showAboutModal.value = true;
};

// 关闭弹窗时，将打赏区域重置为折叠状态，保持下次打开时的整洁
const closeAboutModal = () => {
  showAboutModal.value = false;
  setTimeout(() => {
    showDonate.value = false;
  }, 200); 
};
</script>

<style scoped>
.app-root { max-width: 900px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background-color: #f4f6f8; }

.top-nav { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: calc(env(safe-area-inset-top, 20px) + 15px) 20px 15px 20px; 
  background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: bold; color: #FF5722; }
.app-logo { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

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
.github-link { margin: 15px 0; padding: 12px; background: #f9f9f9; border-radius: 8px; font-size: 14px; color: #333;}
.github-link a { color: #2196F3; font-weight: bold; text-decoration: none; }

/* 🌟 打赏模块专属样式 */
.donate-toggle-btn {
  width: 100%; padding: 12px; margin-top: 5px; border: none; border-radius: 8px;
  font-size: 14px; font-weight: bold; cursor: pointer; 
  background: #fff3e0; color: #e65100; transition: transform 0.1s;
}
.donate-toggle-btn:active { transform: scale(0.96); }

.donate-section {
  margin-top: 10px; padding: 15px 10px; background: #fafafa; 
  border-radius: 12px; border: 1px solid #eee;
  animation: fadeIn 0.3s ease;
}
.donate-tip { font-size: 13px; color: #444; margin-top: 0; margin-bottom: 12px; line-height: 1.5; }
.small-tip { font-size: 11px; color: #888; }

.qr-codes { display: flex; justify-content: center; gap: 20px; }
.qr-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.qr-img { 
  width: 100px; height: 100px; border-radius: 8px; object-fit: cover; 
  border: 1px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  /* 确保长按图片时，系统原生菜单(保存图片)能正常唤起 */
  -webkit-touch-callout: default; pointer-events: auto;
}
.qr-label { font-size: 12px; font-weight: bold; }
.wechat-color { color: #07C160; }
.alipay-color { color: #1677FF; }

.modal-footer { margin-top: 20px; }
.confirm-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; background: #f0f0f0; color: #555; }

@keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>