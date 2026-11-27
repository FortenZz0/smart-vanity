<script setup lang="ts">
import { ref } from 'vue'
import { translate } from '../../locales'
import { resetLocalData } from '../data/resetLocalData'

const resetPending = ref(false)
const resetMessage = ref<'demoResetDone' | 'demoResetError' | null>(null)

async function resetToDemo() {
  if (resetPending.value || !window.confirm(translate('demoResetConfirm'))) return

  resetPending.value = true
  resetMessage.value = null
  try {
    const [{ demoProducts }, { demoArchivedRituals, demoRituals }] = await Promise.all([
      import('../../storage/demoProducts'),
      import('../../storage/demoRituals'),
    ])
    await resetLocalData(
      { products: true, rituals: true },
      [...demoProducts, ...demoRituals, ...demoArchivedRituals],
    )
    resetMessage.value = 'demoResetDone'
  } catch (error) {
    console.error('Failed to reset to demo data', error)
    resetMessage.value = 'demoResetError'
  } finally {
    resetPending.value = false
  }
}
</script>

<template>
  <section class="demo-settings" aria-labelledby="demo-settings-title">
    <h3 id="demo-settings-title">{{ translate('demoSettings') }}</h3>
    <button type="button" :disabled="resetPending" @click="resetToDemo">
      {{ translate('demoReset') }}
    </button>
    <p v-if="resetMessage" role="status">{{ translate(resetMessage) }}</p>
  </section>
</template>

<style scoped>
.demo-settings {
  margin-block-start: 1.5rem;
}
</style>
