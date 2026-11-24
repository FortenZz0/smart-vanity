<script setup lang="ts">
import { ref } from 'vue'
import { translate } from '../../locales'
import { exportBackup as downloadBackup, importBackup as restoreBackup, InvalidBackupError } from './backup'

const backupInput = ref<HTMLInputElement | null>(null)
const importPhotos = ref(true)
const importRituals = ref(true)
const backupBusy = ref(false)
const backupMessage = ref<'productBackupImported' | 'productBackupInvalid' | 'productBackupImportError' | 'productBackupExportError' | null>(null)

async function exportBackup() {
  if (backupBusy.value) return
  backupBusy.value = true
  backupMessage.value = null
  try {
    await downloadBackup()
  } catch (error) {
    console.error('Failed to export the product backup', error)
    backupMessage.value = 'productBackupExportError'
  } finally {
    backupBusy.value = false
  }
}

async function importBackup(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || backupBusy.value) return

  backupBusy.value = true
  backupMessage.value = null
  try {
    await restoreBackup(await file.text(), { includePhotos: importPhotos.value, includeRituals: importRituals.value })
    backupMessage.value = 'productBackupImported'
  } catch (error) {
    if (error instanceof InvalidBackupError) {
      backupMessage.value = 'productBackupInvalid'
    } else {
      console.error('Failed to import the product backup', error)
      backupMessage.value = 'productBackupImportError'
    }
  } finally {
    backupBusy.value = false
  }
}
</script>

<template>
  <section class="product-backup" aria-labelledby="product-backup-title">
    <h2 id="product-backup-title">{{ translate('productBackup') }}</h2>
    <p>{{ translate('productBackupDescription') }}</p>
    <label class="product-backup__option">
      <input v-model="importPhotos" type="checkbox" :disabled="backupBusy">
      {{ translate('productBackupImportPhotos') }}
    </label>
    <label class="product-backup__option">
      <input v-model="importRituals" type="checkbox" :disabled="backupBusy">
      {{ translate('productBackupImportRituals') }}
    </label>
    <div class="product-backup__actions">
      <button type="button" :disabled="backupBusy" @click="exportBackup">
        {{ translate('productBackupExport') }}
      </button>
      <button type="button" :disabled="backupBusy" @click="backupInput?.click()">
        {{ translate('productBackupImport') }}
      </button>
    </div>
    <input ref="backupInput" type="file" accept=".json,application/json" hidden :disabled="backupBusy" @change="importBackup">
    <p v-if="backupBusy || backupMessage" role="status">
      {{ translate(backupBusy ? 'productBackupBusy' : backupMessage!) }}
    </p>
  </section>
</template>

<style scoped>
.product-backup {
  margin-block-start: 1.5rem;
}

.product-backup__option {
  display: block;
  margin-block-end: 0.75rem;
}

.product-backup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
