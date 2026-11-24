<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { translate } from '../../locales'
import { exportBackup as downloadBackup, importBackup as restoreBackup, InvalidBackupError, resetBackupData } from './backup'

const backupInput = ref<HTMLInputElement | null>(null)
const optionsDialog = ref<HTMLDialogElement | null>(null)
const actionLabels = {
  export: 'productBackupExport',
  import: 'productBackupImport',
  reset: 'productBackupReset',
} as const
type Action = keyof typeof actionLabels
const action = ref<Action>('export')
const includeProducts = ref(true)
const includePhotos = ref(true)
const includeRituals = ref(true)
const hasTransferSelection = computed(() => includeProducts.value || includeRituals.value)
const fullTransfer = computed({
  get: () => includeProducts.value && includePhotos.value && includeRituals.value,
  set: (selected: boolean) => {
    includeProducts.value = selected
    includePhotos.value = selected
    includeRituals.value = selected
  },
})
const resetProducts = ref(false)
const resetRituals = ref(false)
const fullReset = computed({
  get: () => resetProducts.value && resetRituals.value,
  set: (selected: boolean) => {
    resetProducts.value = selected
    resetRituals.value = selected
  },
})
const backupBusy = ref(false)
const backupMessage = ref<
  'productBackupImported' | 'productBackupInvalid' | 'productBackupImportError' | 'productBackupExportError' |
  'productBackupResetDone' | 'productBackupResetError' | null
>(null)

async function openOptions(nextAction: Action) {
  action.value = nextAction
  fullTransfer.value = true
  fullReset.value = false
  await nextTick()
  optionsDialog.value?.showModal()
}

async function exportBackup() {
  if (backupBusy.value || !hasTransferSelection.value) return
  optionsDialog.value?.close()
  backupBusy.value = true
  backupMessage.value = null
  try {
    await downloadBackup(transferOptions())
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
  if (!file || backupBusy.value || !hasTransferSelection.value) return

  optionsDialog.value?.close()
  backupBusy.value = true
  backupMessage.value = null
  try {
    const options = transferOptions()
    await restoreBackup(await file.text(), options)
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

function transferOptions() {
  return {
    includeProducts: includeProducts.value,
    includePhotos: includeProducts.value && includePhotos.value,
    includeRituals: includeRituals.value,
  }
}

async function resetBackup() {
  if (backupBusy.value || (!resetProducts.value && !resetRituals.value)) return
  optionsDialog.value?.close()
  backupBusy.value = true
  backupMessage.value = null
  try {
    await resetBackupData({ products: resetProducts.value, rituals: resetRituals.value })
    backupMessage.value = 'productBackupResetDone'
  } catch (error) {
    console.error('Failed to reset backup data', error)
    backupMessage.value = 'productBackupResetError'
  } finally {
    backupBusy.value = false
  }
}
</script>

<template>
  <section class="product-backup" aria-labelledby="product-backup-title">
    <h2 id="product-backup-title">{{ translate('productBackup') }}</h2>
    <div class="product-backup__actions">
      <button type="button" :disabled="backupBusy" aria-haspopup="dialog" @click="openOptions('export')">
        {{ translate('productBackupExport') }}
      </button>
      <button type="button" :disabled="backupBusy" aria-haspopup="dialog" @click="openOptions('import')">
        {{ translate('productBackupImport') }}
      </button>
      <button type="button" :disabled="backupBusy" aria-haspopup="dialog" @click="openOptions('reset')">
        {{ translate('productBackupReset') }}
      </button>
    </div>
    <dialog ref="optionsDialog" class="product-backup__dialog" aria-labelledby="product-backup-action-title">
      <h3 id="product-backup-action-title">{{ translate(actionLabels[action]) }}</h3>
      <template v-if="action === 'reset'">
        <label class="product-backup__option">
          <input v-model="fullReset" type="checkbox" :indeterminate="resetProducts !== resetRituals">
          {{ translate('productBackupFullReset') }}
        </label>
        <div class="product-backup__suboptions">
          <label class="product-backup__option">
            <input v-model="resetRituals" type="checkbox">
            {{ translate('productBackupResetRituals') }}
          </label>
          <label class="product-backup__option">
            <input v-model="resetProducts" type="checkbox">
            {{ translate('productBackupResetProducts') }}
          </label>
        </div>
        <p>{{ translate('productBackupConfirmReset') }}</p>
      </template>
      <template v-else>
        <p>{{ translate(action === 'export' ? 'productBackupExportHint' : 'productBackupDescription') }}</p>
        <label class="product-backup__option">
          <input v-model="fullTransfer" type="checkbox" :indeterminate="hasTransferSelection && !fullTransfer">
          {{ translate(action === 'export' ? 'productBackupFullExport' : 'productBackupFullImport') }}
        </label>
        <div class="product-backup__suboptions">
          <label class="product-backup__option">
            <input v-model="includeProducts" type="checkbox" @change="includePhotos = includeProducts && includePhotos">
            {{ translate(action === 'export' ? 'productBackupExportProducts' : 'productBackupImportProducts') }}
          </label>
          <label class="product-backup__option">
            <input v-model="includePhotos" type="checkbox" :disabled="!includeProducts">
            {{ translate(action === 'export' ? 'productBackupExportPhotos' : 'productBackupImportPhotos') }}
          </label>
          <label class="product-backup__option">
            <input v-model="includeRituals" type="checkbox">
            {{ translate(action === 'export' ? 'productBackupExportRituals' : 'productBackupImportRituals') }}
          </label>
        </div>
      </template>
      <input ref="backupInput" type="file" accept=".json,application/json" hidden @change="importBackup">
      <div class="product-backup__actions">
        <button type="button" autofocus @click="optionsDialog?.close()">
          {{ translate('productBackupCancel') }}
        </button>
        <button v-if="action === 'export'" type="button" :disabled="!hasTransferSelection" @click="exportBackup">
          {{ translate('productBackupExport') }}
        </button>
        <button v-else-if="action === 'import'" type="button" :disabled="!hasTransferSelection" @click="backupInput?.click()">
          {{ translate('productBackupChooseFile') }}
        </button>
        <button
          v-else
          type="button"
          class="product-backup__reset"
          :disabled="!resetProducts && !resetRituals"
          @click="resetBackup"
        >
          {{ translate('productBackupResetSelected') }}
        </button>
      </div>
    </dialog>
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

.product-backup__dialog {
  box-sizing: border-box;
  inline-size: min(24rem, calc(100% - 2rem));
  border: 1px solid var(--color-divider);
  border-radius: 0.875rem;
  background: var(--color-surface);
  color: var(--color-text);
}

.product-backup__dialog::backdrop {
  background: rgb(0 0 0 / 45%);
}

.product-backup__dialog h3 {
  margin-block-start: 0;
}

.product-backup__suboptions {
  padding-inline-start: 1rem;
}

.product-backup__reset:enabled {
  color: var(--color-expiry-warning-text);
}
</style>
