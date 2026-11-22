<script setup lang="ts">
import { RouterLink } from 'vue-router'

const items = [
  { name: 'home', label: 'Главная' },
  { name: 'explore', label: 'Обзор' },
  { name: 'profile', label: 'Профиль' },
]
</script>

<template>
  <nav class="bottom-nav" aria-label="Разделы приложения">
    <div class="bottom-nav__items">
      <RouterLink
        v-for="item in items"
        :key="item.name"
        :to="{ name: item.name }"
        class="bottom-nav__link"
      >
        <span class="bottom-nav__icon" :data-icon="item.name" aria-hidden="true"></span>
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: sticky;
  bottom: 0;
  z-index: 1;
  padding: 0.5rem;
  padding-right: max(0.5rem, env(safe-area-inset-right));
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  padding-left: max(0.5rem, env(safe-area-inset-left));
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.bottom-nav__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  max-width: 30rem;
  margin-inline: auto;
}

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

[data-icon='home'] {
  --icon: url('../../assets/icons/home.svg');
}

[data-icon='explore'] {
  --icon: url('../../assets/icons/explore.svg');
}

[data-icon='profile'] {
  --icon: url('../../assets/icons/person.svg');
}
</style>
