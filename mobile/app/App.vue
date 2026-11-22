<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
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
      <RouterLink
        v-if="route.name === 'home'"
        :to="{ name: 'create-product' }"
        :aria-label="translate('addProduct')"
        class="add-product"
      >
        <span aria-hidden="true">+</span>
      </RouterLink>
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

.add-product {
  position: absolute;
  inset-block-end: calc(100% + 0.75rem);
  inset-inline-end: calc(1rem + env(safe-area-inset-right, 0px));
  display: grid;
  inline-size: 3.5rem;
  block-size: 3.5rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 2rem;
  line-height: 1;
  text-decoration: none;
}
</style>
