<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  label: string
}>()
</script>

<template>
  <RouterLink :to="to" :aria-label="label" class="floating-action-button">
    <span aria-hidden="true">+</span>
  </RouterLink>
</template>

<style scoped>
.floating-action-button {
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
