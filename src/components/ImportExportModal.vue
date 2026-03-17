<template>
    <div class="modal-overlay" @click.self="safeClose">
      <div class="nice-modal large-modal">
        <div class="modal-header">
          <h3>🔄 数据同步</h3>
          <button class="close-btn" @click="safeClose">×</button>
        </div>
  
        <div class="tabs">
          <button :class="{ active: activeTab === 'export' }" @click="activeTab = 'export'">📤 导出</button>
          <button :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">📥 导入</button>
        </div>
  
        <div class="tab-content" v-if="activeTab === 'export'">
          <p class="help-text">将你的食谱与动态算法规则导出为 JSON 格式备份。</p>
          
          <div class="action-row">
            <button class="action-btn copy-btn" @click="copyToClipboard">📋 复制文本</button>
            <button class="action-btn download-btn" @click="downloadFile">💾 保存到本地</button>
          </div>
          
          <label class="section-label">JSON 预览：</label>
          <textarea class="json-preview" readonly :value="jsonDataStr"></textarea>
        </div>
  
        <div class="tab-content" v-if="activeTab === 'import'">
          <p class="help-text">选择数据来源，导入的数据将会覆盖现有的食谱。</p>
          
          <div class="import-methods">
            <label class="radio-label"><input type="radio" value="clipboard" v-model="importMethod"> 剪贴板</label>
            <label class="radio-label"><input type="radio" value="url" v-model="importMethod"> 直链 URL</label>
            <label class="radio-label"><input type="radio" value="file" v-model="importMethod"> 选文件</label>
          </div>
  
          <div v-if="importMethod === 'clipboard'" class="method-panel">
            <textarea v-model="importText" class="form-input" rows="6" placeholder="在此粘贴 JSON 文本..."></textarea>
            <button class="action-btn primary-btn full-width" @click="parseAndImport(importText)">🚀 解析并导入</button>
          </div>
  
          <div v-if="importMethod === 'url'" class="method-panel">
            <input type="text" v-model="importUrl" class="form-input" placeholder="输入 JSON 文件的直链 (如 GitHub Raw)...">
            <button class="action-btn primary-btn full-width" @click="fetchAndImport">🌐 拉取并导入</button>
          </div>
  
          <div v-if="importMethod === 'file'" class="method-panel">
            <div class="file-upload-box">
              <input type="file" accept=".json" @change="handleFileChange" class="file-input">
              <p>点击选择 .json 文件</p>
            </div>
          </div>
        </div>
      </div>
  
      <div class="toast-notification" v-if="toastMsg">{{ toastMsg }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useFoodConfig } from '../composables/useFoodConfig';
  import { Capacitor } from '@capacitor/core';
  import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
  
  const emit = defineEmits(['close', 'data-parsed']);
  const { allFoods, rules } = useFoodConfig();
  
  const activeTab = ref('export');
  const importMethod = ref('clipboard');
  const importText = ref('');
  const importUrl = ref('');
  
  // --- 🌟 自定义美化提示逻辑 ---
  const toastMsg = ref('');
  const showToast = (msg) => {
    toastMsg.value = msg;
    setTimeout(() => toastMsg.value = '', 3000);
  };
  
  // 🌟 修复输入法高度破坏：强制失焦并让系统重绘视口高度
  const safeClose = () => {
    document.activeElement?.blur(); 
    setTimeout(() => {
      window.scrollTo(0, Math.max(document.body.scrollTop, document.documentElement.scrollTop));
      emit('close');
    }, 150); // 给键盘 150ms 缩回的时间再销毁 DOM
  };
  
  const jsonDataStr = computed(() => JSON.stringify({ foods: allFoods.value, rules: rules.value }, null, 2));
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonDataStr.value);
      showToast('✅ 成功复制到剪贴板！');
    } catch (err) {
      showToast('❌ 剪贴板写入失败，请手动复制。');
    }
  };
  
  // --- 🌟 完美原生下载逻辑 ---
  const downloadFile = async () => {
    const fileName = `WhatToEatConfig_${new Date().toISOString().slice(0,10)}.json`;
    
    if (Capacitor.isNativePlatform()) {
      // 手机 App：调用原生文件系统 API 写入公共目录 (文档)
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: jsonDataStr.value,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        showToast(`✅ 已成功保存到手机的 [ 文档 / Documents ] 目录！`);
      } catch (e) {
        showToast(`❌ 导出失败，请检查存储权限：${e.message}`);
      }
    } else {
      // 电脑网页版：传统下载
      const blob = new Blob([jsonDataStr.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ 下载已开始');
    }
  };
  
  // --- 导入逻辑 ---
  const parseAndImport = (text) => {
    if (!text.trim()) return showToast("输入内容不能为空！");
    try {
      const data = JSON.parse(text);
      if (!data.foods && !data.rules) throw new Error("缺少必要字段");
      
      // 解析成功后同样执行安全关闭逻辑
      document.activeElement?.blur();
      setTimeout(() => {
        window.scrollTo(0, 0);
        emit('data-parsed', data);
        emit('close');
      }, 150);
    } catch (err) {
      showToast('❌ 解析失败，请检查 JSON 格式是否正确。');
    }
  };
  
  const fetchAndImport = async () => {
    if (!importUrl.value.trim()) return showToast('请输入 URL！');
    try {
      const res = await fetch(importUrl.value);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      parseAndImport(text);
    } catch (err) {
      showToast(`❌ 拉取失败: ${err.message}`);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseAndImport(event.target.result);
    reader.onerror = () => showToast("❌ 文件读取失败");
    reader.readAsText(file);
  };
  </script>
  
  <style scoped>
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .nice-modal { background: white; width: 100%; max-width: 450px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: zoomIn 0.2s ease; display: flex; flex-direction: column; max-height: 85vh;}
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #f0f0f0; }
  .modal-header h3 { margin: 0; font-size: 18px; color: #333; }
  .close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; line-height: 1; padding: 0;}
  
  .tabs { display: flex; background: #f8f9fa; border-bottom: 1px solid #eee; }
  .tabs button { flex: 1; padding: 12px 0; border: none; background: transparent; font-size: 15px; font-weight: bold; color: #666; cursor: pointer; transition: all 0.2s;}
  .tabs button.active { color: #2196F3; border-bottom: 3px solid #2196F3; background: white; }
  
  .tab-content { padding: 20px; overflow-y: auto; }
  .help-text { font-size: 13px; color: #666; margin: 0 0 15px 0; line-height: 1.5; }
  
  .action-row { display: flex; gap: 10px; margin-bottom: 15px; }
  .action-btn { padding: 10px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; transition: transform 0.1s;}
  .action-btn:active { transform: scale(0.96); }
  .copy-btn { background: #e3f2fd; color: #1565c0; }
  .download-btn { background: #e8f5e9; color: #2e7d32; }
  .primary-btn { background: #2196F3; color: white; margin-top: 15px; }
  .full-width { width: 100%; }
  
  .section-label { font-size: 13px; font-weight: bold; color: #444; margin-bottom: 5px; display: block; }
  .json-preview { width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 12px; background: #f5f5f5; color: #555; resize: none; box-sizing: border-box; outline: none;}
  
  .import-methods { display: flex; gap: 15px; margin-bottom: 15px; }
  .radio-label { font-size: 14px; display: flex; align-items: center; gap: 4px; cursor: pointer; color: #444; }
  
  .method-panel { animation: fadeIn 0.2s ease; }
  .form-input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; font-family: inherit;}
  .form-input:focus { border-color: #2196F3; }
  
  .file-upload-box { border: 2px dashed #ccc; border-radius: 8px; padding: 30px; text-align: center; position: relative; background: #fafafa; cursor: pointer; transition: border 0.2s;}
  .file-upload-box:hover { border-color: #2196F3; background: #f4faff;}
  .file-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  
  /* 🌟 美化 Toast 吐司提示样式 */
  .toast-notification {
    position: fixed; top: 40px; left: 50%; transform: translateX(-50%);
    background: rgba(40, 40, 40, 0.95); color: white; padding: 12px 20px;
    border-radius: 30px; font-size: 14px; z-index: 2000; font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2); white-space: nowrap;
    animation: dropDown 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  }
  
  @keyframes dropDown { from { top: -20px; opacity: 0; } to { top: 40px; opacity: 1; } }
  @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
  @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  </style>