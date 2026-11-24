<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ProductCard from '../features/products/ProductCard.vue'
import { getProductExpiry } from '../features/products/expiry'
import type { Product } from '../features/products/product'
import { archiveProduct, getProduct, listProducts, markProductOpened, restoreProduct } from '../features/products/productRepository'
import { getNextRitualReminder } from '../features/rituals/nextRitualReminder'
import type { Ritual } from '../features/rituals/ritual'
import RitualCard from '../features/rituals/RitualCard.vue'
import { listRituals } from '../features/rituals/ritualRepository'
import { translate } from '../locales'

const soonThresholdDays = 30
const upcomingRitualHours = 24
const rituals = ref<Ritual[]>([])
const now = ref(new Date())
let ritualClock: number | undefined
const products = ref<Product[]>([])
const loadState = ref<'loading' | 'ready' | 'error'>('loading')
const openSections = reactive({ active: true, archived: false })
const pendingActions = reactive(new Set<string>())
const actionFailed = ref(false)
const productActions = { open: markProductOpened, archive: archiveProduct, restore: restoreProduct }

const cards = computed(() => products.value.map((product) => {
  const expiry = getProductExpiry(product)
  const days = expiry.remainingDays
  return { product, expiry, expiringSoon: days !== null && days >= 0 && days <= soonThresholdDays }
}))

const active = computed(() => cards.value.filter(({ product }) => product.archivedAt === null))
const expiringSoon = computed(() => active.value
  .filter((card) => card.expiringSoon)
  .sort((a, b) => (a.expiry.remainingDays ?? 0) - (b.expiry.remainingDays ?? 0)))

const upcomingRituals = computed(() => {
  const currentTime = now.value.getTime()
  const cutoff = currentTime + upcomingRitualHours * 3_600_000
  return rituals.value.flatMap((ritual) => {
    if (ritual.archivedAt !== null) return []
    const next = getNextRitualReminder(ritual, now.value)
    if (!next) return []

    const [hours, minutes] = next.time.split(':').map(Number)
    const localDate = new Date(currentTime)
    localDate.setFullYear(next.date.getUTCFullYear(), next.date.getUTCMonth(), next.date.getUTCDate())
    const timestamp = localDate.setHours(hours, minutes, 0, 0)
    return timestamp >= currentTime && timestamp <= cutoff ? [{ ritual, timestamp }] : []
  }).sort((a, b) => a.timestamp - b.timestamp)
})

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

onMounted(async () => {
  ritualClock = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
  try {
    rituals.value = await listRituals()
    now.value = new Date()
  } catch (error) {
    console.error('Failed to load local rituals', error)
  }
})

onUnmounted(() => window.clearInterval(ritualClock))

async function runProductAction(product: Product, action: keyof typeof productActions) {
  const { id } = product
  if (pendingActions.has(id)) return

  pendingActions.add(id)
  actionFailed.value = false
  try {
    await productActions[action](id)
    const updated = await getProduct(id)
    const index = products.value.findIndex((item) => item.id === id)
    if (updated && index !== -1) products.value[index] = updated
  } catch (error) {
    console.error('Failed to update the local product', error)
    actionFailed.value = true
  } finally {
    pendingActions.delete(id)
  }
}
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
      <p v-if="actionFailed" class="home__status" role="alert">
        {{ translate('productSaveError') }}
      </p>
      <section v-if="expiringSoon.length" aria-labelledby="expiring-soon-heading">
        <h2 id="expiring-soon-heading">{{ translate('expiringSoon') }}</h2>
        <ul class="home__list home__list--horizontal" tabindex="0">
          <li v-for="card in expiringSoon" :key="card.product.id">
            <ProductCard
              :product="card.product"
              :expiry="card.expiry"
              :action-pending="pendingActions.has(card.product.id)"
              expiring-soon
              layout="tile"
              @quick-action="runProductAction(card.product, $event)"
            />
          </li>
        </ul>
      </section>
    </template>

    <details v-if="upcomingRituals.length" open>
      <summary><h2>{{ translate('upcomingRituals') }}</h2></summary>
      <ul class="home__list" role="list">
        <li v-for="{ ritual } in upcomingRituals" :key="ritual.id">
          <RouterLink class="home__ritual-link" :to="{ name: 'edit-ritual', params: { ritualId: ritual.id } }">
            <RitualCard :ritual="ritual" :now="now" />
          </RouterLink>
        </li>
      </ul>
    </details>

    <template v-if="loadState === 'ready'">
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
                :action-pending="pendingActions.has(card.product.id)"
                layout="row"
                @quick-action="runProductAction(card.product, $event)"
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

.home__ritual-link {
  display: block;
  border-radius: 0.875rem;
  color: inherit;
  text-decoration: none;
}
</style>
