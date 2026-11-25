<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import filterIcon from '../../../assets/icons/filter_alt.svg'
import { translate } from '../../locales'
import { productFilterOptions, productSortOptions, type ProductFilter, type ProductSort } from './productListOptions'

const filter = defineModel<ProductFilter>('filter', { required: true })
const sort = defineModel<ProductSort>('sort', { required: true })
const dropdown = ref<HTMLDetailsElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

function close() {
  if (dropdown.value) dropdown.value.open = false
}

function closeOnOutsidePointer(event: PointerEvent) {
  if (!dropdown.value?.contains(event.target as Node | null)) close()
}

function closeOnBlur(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !dropdown.value?.contains(event.relatedTarget)) close()
}

function closeOnEscape(event: KeyboardEvent) {
  if (!dropdown.value?.open) return
  event.preventDefault()
  close()
  trigger.value?.focus()
}

onMounted(() => document.addEventListener('pointerdown', closeOnOutsidePointer))
onUnmounted(() => document.removeEventListener('pointerdown', closeOnOutsidePointer))
</script>

<template>
  <details ref="dropdown" class="product-list-options" @focusout="closeOnBlur" @keydown.esc="closeOnEscape">
    <summary
      ref="trigger"
      :aria-label="translate('productListOptions')"
      :title="translate('productListOptions')"
      :class="{ 'product-list-options__active': filter !== 'all' || sort !== 'default' }"
    >
      <span :style="{ maskImage: `url(${JSON.stringify(filterIcon)})` }" aria-hidden="true"></span>
    </summary>
    <div class="product-list-options__panel">
      <label>
        {{ translate('productListFilter') }}
        <select v-model="filter">
          <option v-for="{ value, label } in productFilterOptions" :key="value" :value="value">
            {{ translate(label) }}
          </option>
        </select>
      </label>
      <label>
        {{ translate('productListSort') }}
        <select v-model="sort">
          <option v-for="{ value, label } in productSortOptions" :key="value" :value="value">
            {{ translate(label) }}
          </option>
        </select>
      </label>
    </div>
  </details>
</template>

<style scoped>
.product-list-options {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
}

.product-list-options[open] {
  z-index: 3;
}

.product-list-options summary {
  display: grid;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  place-items: center;
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  list-style: none;
}

.product-list-options summary::-webkit-details-marker {
  display: none;
}

.product-list-options[open] summary,
.product-list-options .product-list-options__active {
  background: var(--color-selected-bg);
  color: var(--color-text);
}

.product-list-options summary span {
  inline-size: 1.5rem;
  aspect-ratio: 1;
  background: currentColor;
  mask: center / contain no-repeat;
}

.product-list-options__panel {
  position: absolute;
  inset-block-start: calc(100% + 0.25rem);
  inset-inline-end: 0;
  z-index: 1;
  display: grid;
  box-sizing: border-box;
  inline-size: min(17rem, calc(100vw - 2rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.75rem;
  background: var(--color-surface);
  box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 15%);
}

.product-list-options__panel label {
  display: grid;
  gap: 0.25rem;
}

.product-list-options__panel select {
  min-inline-size: 0;
  min-block-size: 2.75rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.5rem;
  font: inherit;
}
</style>
