<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import FloatingActionButton from './components/FloatingActionButton.vue'
import { translate } from './locales'

const route = useRoute()
const footerHidden = ref(false)
let keyboardClosing = false
let viewportWidth = 0
let fullViewportHeight = 0

function getViewportHeight() {
  const viewport = window.visualViewport
  return Math.min(window.innerHeight, viewport ? viewport.height * viewport.scale : window.innerHeight)
}

function onKeyboardShow() {
  keyboardClosing = false
  footerHidden.value = true
}

function onKeyboardHide() {
  if (!footerHidden.value) return

  keyboardClosing = true
  onViewportResize()
}

function onViewportResize() {
  const height = getViewportHeight()
  const width = window.innerWidth

  if (!footerHidden.value) {
    // The viewport can shrink before the native keyboard event reaches JavaScript.
    fullViewportHeight = width === viewportWidth ? Math.max(fullViewportHeight, height) : height
    viewportWidth = width
    return
  }

  // After rotation or a window resize, the previous height no longer applies.
  const viewportRestored = width !== viewportWidth || height >= fullViewportHeight - 2
  if (keyboardClosing && viewportRestored) {
    keyboardClosing = false
    fullViewportHeight = height
    viewportWidth = width
    footerHidden.value = false
  }
}

onMounted(() => {
  onViewportResize()
  window.addEventListener('keyboardWillShow', onKeyboardShow)
  window.addEventListener('keyboardDidHide', onKeyboardHide)
  window.addEventListener('resize', onViewportResize)
  window.visualViewport?.addEventListener('resize', onViewportResize)
})

onUnmounted(() => {
  window.removeEventListener('keyboardWillShow', onKeyboardShow)
  window.removeEventListener('keyboardDidHide', onKeyboardHide)
  window.removeEventListener('resize', onViewportResize)
  window.visualViewport?.removeEventListener('resize', onViewportResize)
})
</script>

<template>
  <div class="app-shell">
    <main class="screen">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <component :is="Component" :key="currentRoute.path" />
      </RouterView>
    </main>
    <div v-show="!footerHidden" id="app-footer" class="app-footer">
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
  line-height: 1.45;
}

.app-shell {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
  min-height: 100dvh;
}

.screen {
  box-sizing: border-box;
  inline-size: min(100%, 46rem);
  min-inline-size: 0;
  margin-inline: auto;
  padding:
    calc(1.5rem + env(safe-area-inset-top, 0px))
    calc(1rem + env(safe-area-inset-right, 0px))
    1rem
    calc(1rem + env(safe-area-inset-left, 0px));
}

.screen h1 {
  margin: 0;
  font-size: clamp(1.85rem, 6vw, 2.5rem);
  font-weight: 750;
  line-height: 1.12;
  letter-spacing: -0.04em;
  overflow-wrap: anywhere;
}

.app-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
}
</style>
