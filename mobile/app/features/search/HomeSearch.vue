<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { translate } from '../../locales'
import type { Product } from '../products/product'
import type { Ritual } from '../rituals/ritual'
import { matchHomeSearch, parseHomeSearch, type SearchScope } from './homeSearch'

const props = defineProps<{ products: readonly Product[]; rituals: readonly Ritual[]; loading: boolean }>()
const router = useRouter()
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const expanded = ref(false)
const qualifiers = [
  { scope: 'product', label: 'homeSearchProducts' },
  { scope: 'ritual', label: 'rituals' },
] as const

const parsedQuery = computed(() => parseHomeSearch(query.value))
const hasQuery = computed(() => Boolean(parsedQuery.value.scope || parsedQuery.value.text))
const groups = computed(() => {
  if (!hasQuery.value) return []
  const { scope, text } = parsedQuery.value
  const products = scope === 'ritual' ? [] : matchHomeSearch(props.products, text)
  const rituals = scope === 'product' ? [] : matchHomeSearch(props.rituals, text)
  return [
    {
      label: 'homeSearchProducts' as const,
      items: products.map(({ id, name, archivedAt }) => ({
        id, name, archivedAt, to: { name: 'edit-product', params: { productId: id } },
      })),
    },
    {
      label: 'rituals' as const,
      items: rituals.map(({ id, name, archivedAt }) => ({
        id, name, archivedAt, to: { name: 'edit-ritual', params: { ritualId: id } },
      })),
    },
  ].filter(({ items }) => items.length > 0)
})

function setScope(scope: SearchScope) {
  query.value = `${scope}: ${parsedQuery.value.text}`
  input.value?.focus()
}

function clearSearch() {
  query.value = ''
  expanded.value = true
  input.value?.focus()
}

function collapseOnBlur(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
    expanded.value = false
  }
}

function dismissResults() {
  if (document.activeElement !== input.value) input.value?.focus()
  expanded.value = false
}

function openFirstResult() {
  const result = groups.value[0]?.items[0]
  if (expanded.value && result) return router.push(result.to)
  expanded.value = true
}
</script>

<template>
  <form
    role="search"
    class="home-search"
    @submit.prevent="openFirstResult"
    @focusout="collapseOnBlur"
    @keydown.esc.prevent="dismissResults"
  >
    <div class="home-search__field">
      <input
        ref="input"
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="translate('homeSearchPlaceholder')"
        :aria-label="translate('homeSearchPlaceholder')"
        @focus="expanded = true"
        @input="expanded = true"
      >
      <button v-if="query" type="button" :aria-label="translate('homeSearchClear')" @mousedown.prevent @click="clearSearch">
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <div v-if="expanded" class="home-search__panel">
      <div v-if="!parsedQuery.scope" class="home-search__qualifiers">
        <button v-for="{ scope, label } in qualifiers" :key="scope" type="button" @mousedown.prevent @click="setScope(scope)">
          <code>{{ scope }}:</code> {{ translate(label) }}
        </button>
      </div>
      <div v-if="hasQuery" class="home-search__results">
        <section v-for="{ label, items } in groups" :key="label">
          <h2>{{ translate(label) }}</h2>
          <ul>
            <li v-for="{ id, name, archivedAt, to } in items" :key="id">
              <RouterLink :to="to" @mousedown.prevent>
                <span>{{ name }}</span>
                <small v-if="archivedAt">{{ translate('homeSearchArchived') }}</small>
              </RouterLink>
            </li>
          </ul>
        </section>
        <p v-if="!groups.length" class="home-search__status" role="status">
          {{ translate(loading ? 'homeSearchLoading' : 'homeSearchEmpty') }}
        </p>
      </div>
    </div>
  </form>
</template>

<style scoped>
.home-search {
  position: relative;
}

.home-search__field {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.home-search__field::before {
  flex: none;
  inline-size: 1.125rem;
  block-size: 1.125rem;
  margin-inline-start: 0.875rem;
  background: currentColor;
  color: var(--color-accent);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6.5'/%3E%3Cpath d='m16 16 4 4'/%3E%3C/svg%3E") center / contain no-repeat;
  content: '';
}

.home-search__field input {
  flex: 1;
  min-inline-size: 0;
  min-block-size: 3.25rem;
  padding: 0.625rem 0.75rem;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: var(--color-text);
  font: inherit;
}

.home-search__field input::placeholder {
  color: var(--color-text-muted);
}

.home-search__field input::-webkit-search-cancel-button {
  appearance: none;
}

.home-search__field button {
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 1.25rem;
}

.home-search__panel {
  position: absolute;
  inset-block-start: 100%;
  inset-inline: 0;
  z-index: 2;
  margin-block-start: 0.375rem;
  padding: 0.5rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-action);
}

.home-search__qualifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.home-search__qualifiers button {
  min-block-size: 2.75rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.5rem;
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  text-align: start;
}

.home-search__qualifiers code {
  color: var(--color-accent);
}

.home-search__results {
  max-block-size: 20rem;
  overflow-y: auto;
  padding: 0.25rem;
}

.home-search__results section + section {
  margin-block-start: 0.5rem;
  border-block-start: 1px solid var(--color-divider);
}

.home-search__results h2 {
  margin: 0.5rem 0.5rem 0.125rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.home-search__results ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-search__results a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  box-sizing: border-box;
  min-block-size: 2.75rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.5rem;
  color: var(--color-text);
  text-decoration: none;
}

.home-search__results a:hover {
  background: var(--color-bg);
}

.home-search__results a span {
  overflow-wrap: anywhere;
}

.home-search__results small,
.home-search__status {
  color: var(--color-text-muted);
}

.home-search__status {
  margin: 0.5rem;
}
</style>
