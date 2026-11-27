<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  name: string // имя экрана
  label: string
  iconUrl: string
  active: boolean
}>()
</script>

<template>
  <RouterLink
    :to="{ name }"
    class="bottom-nav__link"
    :class="{ 'bottom-nav__link--active': active }"
  >
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
  min-height: 3.25rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1875rem;
  border-radius: var(--radius-control);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
}

.bottom-nav__link--active {
  color: var(--color-accent);
}

.bottom-nav__link--active .bottom-nav__icon {
  background-color: var(--color-selected-bg);
}

.bottom-nav__link--active .bottom-nav__icon::before {
  background-color: currentColor;
}

.bottom-nav__icon {
  display: grid;
  inline-size: 3rem;
  block-size: 1.625rem;
  place-items: center;
  border-radius: 1rem;
}

.bottom-nav__icon::before {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  background-color: currentColor;
  mask: var(--icon) center / contain no-repeat;
  content: '';
}
</style>
