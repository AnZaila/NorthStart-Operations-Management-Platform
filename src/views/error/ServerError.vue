<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="not-found-page">
    <p class="eyebrow">SERVER ERROR</p>
    <h1>500</h1>
    <p class="description">服务暂时不可用，请稍后重试，或返回工作台继续操作。</p>
    <el-button type="primary" :tag="RouterLink" to="/dashboard">返回工作台</el-button>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: var(--color-bg);
}
.eyebrow {
  margin: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
}
h1 {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 72px;
  line-height: 1;
}
.description {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
