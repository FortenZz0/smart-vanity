<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="screen">
    <RouterView />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.screen {
  box-sizing: border-box;
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1rem;
  place-items: center;
  text-align: center;
}

.screen h1 {
  margin: 0;
}
</style>
