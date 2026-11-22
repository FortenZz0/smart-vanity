<script setup lang="ts">
import exploreIcon from '../../assets/icons/explore.svg'
import homeIcon from '../../assets/icons/home.svg'
import profileIcon from '../../assets/icons/person.svg'
import BottomNavItem from './BottomNavItem.vue'

const items = [
  { name: 'home', label: 'Главная', iconUrl: homeIcon },
  { name: 'explore', label: 'Обзор', iconUrl: exploreIcon },
  { name: 'profile', label: 'Профиль', iconUrl: profileIcon },
]
</script>

<template>
  <nav class="bottom-nav" aria-label="Разделы приложения">
    <div class="bottom-nav__items">
      <BottomNavItem
        v-for="item in items"
        :key="item.name"
        :name="item.name"
        :label="item.label"
        :icon-url="item.iconUrl"
      />
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
</style>
