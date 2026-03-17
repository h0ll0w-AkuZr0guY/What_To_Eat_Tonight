<template>
  <div class="import-wrapper">
    <input type="file" accept=".json" @change="handleFileChange" ref="fileInputRef" class="hidden-input">
    <button class="pill-btn import" @click="triggerUpload">📥 导入</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['data-parsed']);
const fileInputRef = ref(null);

const triggerUpload = () => fileInputRef.value.click();

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsedData = JSON.parse(e.target.result);
      emit('data-parsed', parsedData);
    } catch (error) {
      alert("文件解析失败！请确保上传的是正确的 JSON 文件。");
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};
</script>

<style scoped>
.import-wrapper { display: inline-block; }
.hidden-input { display: none; }
/* 样式与 ManageView 里的药丸按钮统一 */
.pill-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 14px; border-radius: 20px; font-size: 13px; font-weight: bold;
  cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
}
.pill-btn:active { transform: scale(0.95); }
.pill-btn.import { background: #fff3e0; color: #e65100; border-color: #ffe0b2; }
</style>