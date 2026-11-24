<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import FloatingActionButton from './components/FloatingActionButton.vue'
import { translate } from './locales'

const route = useRoute()
</script>

<template>
  <div class="app-shell">
    <main class="screen">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <component :is="Component" :key="currentRoute.path" />
      </RouterView>
    </main>
    <div class="app-footer">
      <FloatingActionButton
        v-if="route.name === 'home'"
        :to="{ name: 'create-product' }"
        :label="translate('addProduct')"
      />
      <FloatingActionButton
        v-else-if="route.name === 'rituals'"
        :to="{ name: 'create-ritual' }"
        :label="translate('createRitual')"
      />
      <BottomNav />
    </div>
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
  min-inline-size: 0;
  padding:
    calc(1rem + env(safe-area-inset-top, 0px))
    calc(1rem + env(safe-area-inset-right, 0px))
    1rem
    calc(1rem + env(safe-area-inset-left, 0px));
}

.screen h1 {
  margin: 0;
}

.app-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
}
</style>
