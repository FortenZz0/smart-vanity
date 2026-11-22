<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  name: string // имя экрана
  label: string
  iconUrl: string
}>()
</script>

<template>
  <RouterLink :to="{ name }" class="bottom-nav__link">
    <span
      class="bottom-nav__icon"
      :style="{ '--icon': `url(${JSON.stringify(iconUrl)})` }"
      aria-hidden="true"
    ></span>
    {{ label }}
  </RouterLink>
</template>

<style scoped>
.bottom-nav__link {
  display: flex;
  min-height: 3rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  border-radius: 0.5rem;
  color: #52525b;
  font-size: 0.75rem;
  line-height: 1.25;
  text-decoration: none;
}

.bottom-nav__link[aria-current='page'] {
  background: #f0f0f2;
  color: #18181b;
  font-weight: 600;
}

.bottom-nav__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.bottom-nav__icon {
  width: 1.5rem;
  height: 1.5rem;
  background-color: currentColor;
  mask: var(--icon) center / contain no-repeat;
}
</style>
