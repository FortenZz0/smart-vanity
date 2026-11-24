<script setup lang="ts">
import { translate } from '../locales'

defineProps<{
  archiveAction?: 'archive' | 'restore'
  submitDisabled: boolean
}>()

defineEmits<{ delete: [] }>()
</script>

<template>
  <div class="editor-actions">
    <button type="submit" :disabled="submitDisabled">{{ translate('save') }}</button>
    <button
      v-if="archiveAction"
      class="editor-actions__archive"
      type="submit"
      :value="archiveAction"
      :disabled="submitDisabled"
    >
      {{ translate(archiveAction === 'archive' ? 'moveToArchive' : 'restoreFromArchive') }}
    </button>
    <button v-if="archiveAction" class="editor-actions__delete" type="button" @click="$emit('delete')">
      {{ translate('delete') }}
    </button>
  </div>
</template>

<style scoped>
.editor-actions {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 0.5rem;
}

.editor-actions button {
  min-block-size: 2.75rem;
  padding: 0.5rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font: inherit;
  overflow-wrap: anywhere;
}

.editor-actions button:disabled {
  opacity: 0.55;
}

.editor-actions :is(.editor-actions__archive, .editor-actions__delete) {
  border: 1px solid var(--color-divider);
  background: var(--color-surface);
  color: var(--color-text);
}

.editor-actions .editor-actions__delete {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
