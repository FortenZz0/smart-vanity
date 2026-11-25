<script setup lang="ts">
import { translate } from '../../locales'

defineProps<{ productName: string; pending: boolean }>()
defineEmits<{ confirm: []; dismiss: []; focusChange: [focused: boolean] }>()
</script>

<template>
  <aside
    class="archive-product-prompt"
    @focusin="$emit('focusChange', true)"
    @focusout="$emit('focusChange', ($event.currentTarget as HTMLElement).contains($event.relatedTarget as Node | null))"
  >
    <span role="status">{{ translate('archiveProductFinishedPrompt').replace('{name}', () => productName) }}</span>
    <button type="button" class="archive-product-prompt__yes" :disabled="pending" @click="$emit('confirm')">
      {{ translate('archiveProductFinishedYes') }}
    </button>
    <button type="button" :aria-label="translate('dismissArchiveProductPrompt')" @click="$emit('dismiss')">
      <span aria-hidden="true">×</span>
    </button>
  </aside>
</template>

<style scoped>
.archive-product-prompt {
  position: absolute;
  inset-block-end: calc(100% + 5rem);
  left: calc(1rem + env(safe-area-inset-left, 0px));
  right: calc(1rem + env(safe-area-inset-right, 0px));
  z-index: 2;
  display: flex;
  max-inline-size: 36rem;
  box-sizing: border-box;
  align-items: center;
  gap: 0.5rem;
  margin-inline: auto;
  padding: 0.75rem 0.625rem 0.75rem 1rem;
  border: 1px solid var(--color-text);
  border-radius: 0.875rem;
  background: var(--color-text);
  color: var(--color-surface);
  font-size: 1.125rem;
  box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 16%);
  pointer-events: none;
}

.archive-product-prompt > span {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.archive-product-prompt button {
  flex: none;
  min-inline-size: 3rem;
  min-block-size: 3rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font: inherit;
  pointer-events: auto;
}

.archive-product-prompt .archive-product-prompt__yes {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
}

.archive-product-prompt button:focus-visible {
  outline-color: var(--color-surface);
}

.archive-product-prompt .archive-product-prompt__yes:disabled {
  opacity: 0.6;
}

.archive-product-prompt-leave-active {
  transition: opacity 250ms ease;
}

.archive-product-prompt-leave-active button {
  pointer-events: none;
}

.archive-product-prompt-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .archive-product-prompt-leave-active {
    transition: none;
  }
}
</style>
