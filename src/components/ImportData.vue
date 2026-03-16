<template>
    <div class="import-wrapper">
      <input 
        type="file" 
        accept=".json" 
        @change="handleFileChange" 
        ref="fileInputRef" 
        class="hidden-input"
      >
      <button class="import-btn" @click="triggerUpload">
        📤 导入数据
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const emit = defineEmits(['data-parsed']);
  const fileInputRef = ref(null);
  
  const triggerUpload = () => {
    fileInputRef.value.click();
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        // 将解析好的数据抛给父组件
        emit('data-parsed', parsedData);
      } catch (error) {
        alert("文件解析失败！请确保上传的是格式正确的 JSON 文件。");
        console.error("JSON Parsing Error:", error);
      } finally {
        // 清空 input 的值，确保下次选择同一个文件也能触发 change 事件
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };
  </script>
  
  <style scoped>
  .import-wrapper {
    display: inline-block;
    width: 100%;
  }
  .hidden-input {
    display: none;
  }
  .import-btn {
    width: 100%;
    background-color: #FF9800;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .import-btn:active {
    opacity: 0.8;
  }
  </style>