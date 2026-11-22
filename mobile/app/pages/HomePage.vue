<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ProductCard from '../features/products/ProductCard.vue'
import { getProductExpiry } from '../features/products/expiry'
import type { Product } from '../features/products/product'
import { listProducts } from '../features/products/productRepository'
import { translate } from '../locales'

const soonThresholdDays = 30
const products = ref<Product[]>([])
const loadState = ref<'loading' | 'ready' | 'error'>('loading')
const openSections = reactive({ active: true, archived: false })

const cards = computed(() => products.value.map((product) => {
  const expiry = getProductExpiry(product)
  const days = expiry.remainingDays
  return { product, expiry, expiringSoon: days !== null && days >= 0 && days <= soonThresholdDays }
}))

const active = computed(() => cards.value.filter(({ product }) => product.archivedAt === null))
const expiringSoon = computed(() => active.value
  .filter((card) => card.expiringSoon)
  .sort((a, b) => (a.expiry.remainingDays ?? 0) - (b.expiry.remainingDays ?? 0)))

const sections = computed(() => [
  { key: 'active', title: 'myProducts', empty: 'noActiveProducts', cards: active.value },
  {
    key: 'archived',
    title: 'productArchive',
    empty: 'noArchivedProducts',
    cards: cards.value.filter(({ product }) => product.archivedAt !== null),
  },
] as const)

async function loadProducts() {
  loadState.value = 'loading'
  try {
    products.value = await listProducts()
    loadState.value = 'ready'
  } catch (error) {
    console.error('Failed to load local products', error)
    loadState.value = 'error'
  }
}

onMounted(loadProducts)
</script>

<template>
  <div class="home">
    <h1>{{ translate('home') }}</h1>

    <p v-if="loadState === 'loading'" class="home__status" role="status">
      {{ translate('productsLoading') }}
    </p>
    <div v-else-if="loadState === 'error'">
      <p class="home__status" role="alert">{{ translate('productsLoadError') }}</p>
      <button type="button" @click="loadProducts">{{ translate('tryAgain') }}</button>
    </div>
    <template v-else>
      <section v-if="expiringSoon.length" aria-labelledby="expiring-soon-heading">
        <h2 id="expiring-soon-heading">{{ translate('expiringSoon') }}</h2>
        <ul class="home__list home__list--horizontal" tabindex="0">
          <li v-for="card in expiringSoon" :key="card.product.id">
            <ProductCard :product="card.product" :expiry="card.expiry" expiring-soon layout="tile" />
          </li>
        </ul>
      </section>

      <details
        v-for="section in sections"
        :key="section.key"
        :open="openSections[section.key]"
        @toggle="openSections[section.key] = ($event.currentTarget as HTMLDetailsElement).open"
      >
        <summary><h2>{{ translate(section.title) }}</h2></summary>
        <template v-if="openSections[section.key]">
          <ul v-if="section.cards.length" class="home__list">
            <li v-for="card in section.cards" :key="card.product.id">
              <ProductCard
                :product="card.product"
                :expiry="card.expiry"
                :expiring-soon="card.expiringSoon"
                layout="row"
              />
            </li>
          </ul>
          <p v-else class="home__status">{{ translate(section.empty) }}</p>
        </template>
      </details>
    </template>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  padding-block-end: 4.25rem;
}

.home h2 {
  margin: 0;
  font-size: 1.2rem;
}

.home summary {
  cursor: pointer;
}

.home summary h2 {
  display: inline;
}

.home__status {
  margin: 0.5rem 0 0;
  color: var(--color-text-muted);
}

.home > .home__status {
  margin: 0;
}

.home__list {
  display: grid;
  gap: 0.625rem;
  margin: 0.625rem 0 0;
  padding: 0;
  list-style: none;
}

.home__list--horizontal {
  display: flex;
  overflow-x: auto;
  padding-block-end: 0.375rem;
  scroll-snap-type: x proximity;
}

.home__list--horizontal > li {
  flex: 0 0 clamp(9rem, 46vw, 12rem);
  min-inline-size: 0;
  scroll-snap-align: start;
}
</style>
