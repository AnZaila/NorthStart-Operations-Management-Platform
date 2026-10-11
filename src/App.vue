<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
console.log(useRouter().getRoutes())
</script>

<style scoped lang="scss">

</style>
