<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import RitualCard from '../features/rituals/RitualCard.vue'
import type { Ritual } from '../features/rituals/ritual'
import { listRituals } from '../features/rituals/ritualRepository'
import { translate } from '../locales'

const rituals = ref<Ritual[]>([])
const loadState = ref<'loading' | 'ready' | 'error'>('loading')
const now = ref(new Date())
let clock: number | undefined

async function loadRituals() {
  loadState.value = 'loading'
  try {
    rituals.value = await listRituals()
    now.value = new Date()
    loadState.value = 'ready'
  } catch (error) {
    console.error('Failed to load local rituals', error)
    loadState.value = 'error'
  }
}

onMounted(() => {
  void loadRituals()
  clock = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => window.clearInterval(clock))
</script>

<template>
  <section class="rituals">
    <h1>{{ translate('rituals') }}</h1>

    <p v-if="loadState === 'loading'" class="rituals__status" role="status">
      {{ translate('ritualsLoading') }}
    </p>
    <div v-else-if="loadState === 'error'">
      <p class="rituals__status" role="alert">{{ translate('ritualsLoadError') }}</p>
      <button type="button" @click="loadRituals">{{ translate('tryAgain') }}</button>
    </div>
    <ul v-else-if="rituals.length" class="rituals__list" role="list">
      <li v-for="ritual in rituals" :key="ritual.id">
        <RitualCard :ritual="ritual" :now="now" />
      </li>
    </ul>
    <p v-else class="rituals__status">{{ translate('noRituals') }}</p>
  </section>
</template>

<style scoped>
.rituals {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  padding-block-end: 4.25rem;
}

.rituals__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rituals__status {
  margin: 0;
  color: var(--color-text-muted);
}

.rituals__status[role='alert'] {
  margin-block-end: 0.5rem;
}
</style>
