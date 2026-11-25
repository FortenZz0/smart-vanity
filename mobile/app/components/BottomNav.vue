<script setup lang="ts">
import { useRoute } from 'vue-router'
import exploreIcon from '../../assets/icons/explore.svg'
import homeIcon from '../../assets/icons/home.svg'
import profileIcon from '../../assets/icons/person.svg'
import { translate } from '../locales'
import BottomNavItem from './BottomNavItem.vue'

const route = useRoute()

const items = [
  { name: 'home', iconUrl: homeIcon },
  { name: 'explore', iconUrl: exploreIcon },
  { name: 'profile', iconUrl: profileIcon },
] as const
</script>

<template>
  <nav class="bottom-nav" :aria-label="translate('navigation')">
    <div class="bottom-nav__items">
      <BottomNavItem
        v-for="item in items"
        :key="item.name"
        :name="item.name"
        :label="translate(item.name)"
        :icon-url="item.iconUrl"
        :active="item.name === (route.meta.navSection ?? route.name)"
      />
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  padding: 0.5rem;
  padding-right: max(0.5rem, env(safe-area-inset-right));
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  padding-left: max(0.5rem, env(safe-area-inset-left));
  border-top: 1px solid var(--color-divider);
  background: var(--color-surface);
}

.bottom-nav__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  max-width: 30rem;
  margin-inline: auto;
}
</style>
