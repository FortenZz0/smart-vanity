<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import ArchiveProductPrompt from '../features/products/ArchiveProductPrompt.vue'
import ProductCard from '../features/products/ProductCard.vue'
import ProductListOptions from '../features/products/ProductListOptions.vue'
import { archivePromptSeconds } from '../features/products/archivePromptDuration'
import { getProductExpiry } from '../features/products/expiry'
import { expiryWarningDays } from '../features/products/expiryWarningDays'
import type { Product } from '../features/products/product'
import { arrangeProducts, type ProductFilter, type ProductSort } from '../features/products/productListOptions'
import { archiveProduct, getProduct, listProducts, markArchivedProductFinished, markProductOpened, restoreProduct } from '../features/products/productRepository'
import { getNextRitualReminder } from '../features/rituals/nextRitualReminder'
import type { Ritual } from '../features/rituals/ritual'
import RitualCard from '../features/rituals/RitualCard.vue'
import { listRituals } from '../features/rituals/ritualRepository'
import { upcomingRitualHours } from '../features/rituals/upcomingRitualHours'
import HomeSearch from '../features/search/HomeSearch.vue'
import { locale, translate } from '../locales'

const rituals = ref<Ritual[]>([])
const ritualsLoading = ref(true)
const now = ref(new Date())
let ritualClock: number | undefined
const products = ref<Product[]>([])
const productFilter = ref<ProductFilter>('all')
const productSort = ref<ProductSort>('default')
const loadState = ref<'loading' | 'ready' | 'error'>('loading')
const openSections = reactive({ active: true, archived: false })
const pendingActions = reactive(new Set<string>())
const actionFailed = ref(false)
const productActions = {
  open: markProductOpened,
  archive: archiveProduct,
  restore: restoreProduct,
  finish: markArchivedProductFinished,
}
const archivePrompt = ref<Product | null>(null)
const promptFocused = ref(false)

watch([archivePrompt, promptFocused], ([product, focused], _, onCleanup) => {
  if (!product || focused) return
  const timeout = window.setTimeout(() => { archivePrompt.value = null }, archivePromptSeconds.value * 1000)
  onCleanup(() => window.clearTimeout(timeout))
})

const cards = computed(() => products.value.map((product) => {
  const expiry = getProductExpiry(product)
  const days = expiry.remainingDays
  return { product, expiry, expiringSoon: days !== null && days >= 0 && days <= expiryWarningDays.value }
}))

const active = computed(() => cards.value.filter(({ product }) => product.archivedAt === null))
const expiringSoon = computed(() => active.value
  .filter(({ product, expiringSoon }) => !product.finished && expiringSoon)
  .sort((a, b) => (a.expiry.remainingDays ?? 0) - (b.expiry.remainingDays ?? 0)))

const upcomingRituals = computed(() => {
  const currentTime = now.value.getTime()
  const cutoff = currentTime + upcomingRitualHours.value * 3_600_000
  return rituals.value.flatMap((ritual) => {
    if (ritual.archivedAt !== null || ritual.paused) return []
    const next = getNextRitualReminder(ritual, now.value)
    if (!next) return []

    const { timestamp } = next
    return timestamp >= currentTime && timestamp <= cutoff ? [{ ritual, timestamp }] : []
  }).sort((a, b) => a.timestamp - b.timestamp)
})

const sections = computed(() => [
  {
    key: 'active',
    title: 'myProducts',
    empty: active.value.length && productFilter.value !== 'all' ? 'noFilteredProducts' : 'noActiveProducts',
    cards: arrangeProducts(active.value, productFilter.value, productSort.value, locale.value),
  },
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
  } finally {
    ritualsLoading.value = false
  }
})

onUnmounted(() => window.clearInterval(ritualClock))

function confirmArchivePrompt() {
  if (archivePrompt.value) return runProductAction(archivePrompt.value, 'finish')
}

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
    if (action === 'archive' && updated?.archivedAt && !updated.finished) {
      promptFocused.value = false
      archivePrompt.value = updated
    } else if (archivePrompt.value?.id === id && (action === 'finish' || action === 'restore')) {
      archivePrompt.value = null
    }
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
    <HomeSearch :products="products" :rituals="rituals" :loading="loadState === 'loading' || ritualsLoading" />

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
      <section v-if="expiringSoon.length" class="home__expiring" aria-labelledby="expiring-soon-heading">
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

    <details v-if="upcomingRituals.length" class="home__upcoming" open>
      <summary><h2>{{ translate('upcomingRituals') }}</h2></summary>
      <ul class="home__list" role="list">
        <li v-for="{ ritual } in upcomingRituals" :key="ritual.id">
          <RitualCard
            :ritual="ritual"
            :now="now"
            interactive
            @updated="Object.assign(ritual, $event)"
          />
        </li>
      </ul>
    </details>

    <template v-if="loadState === 'ready'">
      <div v-for="section in sections" :key="section.key" class="home__products-section">
        <details
          :open="openSections[section.key]"
          @toggle="openSections[section.key] = ($event.currentTarget as HTMLDetailsElement).open"
        >
          <summary :class="{ 'home__products-summary--with-options': section.key === 'active' }">
            <h2>{{ translate(section.title) }}</h2>
          </summary>
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
        <ProductListOptions v-if="section.key === 'active'" v-model:filter="productFilter" v-model:sort="productSort" />
      </div>
    </template>
    <Teleport defer to="#app-footer">
      <Transition name="archive-product-prompt">
        <ArchiveProductPrompt
          v-if="archivePrompt"
          :key="archivePrompt.id"
          :product-name="archivePrompt.name"
          :pending="pendingActions.has(archivePrompt.id)"
          @confirm="confirmArchivePrompt"
          @dismiss="archivePrompt = null"
          @focus-change="promptFocused = $event"
        />
      </Transition>
    </Teleport>
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
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.home summary {
  min-block-size: 2.75rem;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
  cursor: pointer;
}

.home summary h2 {
  display: inline;
}

.home__products-section {
  position: relative;
}

.home__products-summary--with-options {
  padding-inline-end: 3.25rem;
}

.home__expiring {
  min-inline-size: 0;
  padding: 0.875rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface-soft);
}

.home__upcoming summary {
  background: var(--color-selected-bg);
}

.home__status {
  margin: 0.5rem 0 0;
  padding: 0.875rem;
  border: 1px dashed var(--color-divider);
  border-radius: var(--radius-control);
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
  padding: 0.125rem 0.125rem 0.5rem;
  scroll-snap-type: x proximity;
}

.home__list--horizontal > li {
  flex: 0 0 clamp(9rem, 46vw, 12rem);
  min-inline-size: 0;
  scroll-snap-align: start;
}
</style>
