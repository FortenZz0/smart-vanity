<script setup lang="ts">
import { RouterView } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="app-shell">
    <main class="screen">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.app-shell {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
}

.screen {
  display: grid;
  padding: 1rem;
  padding-top: max(1rem, env(safe-area-inset-top));
  place-items: center;
  text-align: center;
}

.screen h1 {
  margin: 0;
}
</style>
