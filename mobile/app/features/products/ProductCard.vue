<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { locale, translate } from '../../locales'
import type { ProductExpiry } from './expiry'
import type { Product } from './product'
import { getProductPhoto } from './productPhotos'

const props = defineProps<{
  product: Product
  expiry: ProductExpiry
  expiringSoon: boolean
  layout: 'row' | 'tile'
}>()

const photoUrl = ref<string | null>(null)

watch(() => props.product.photoId, async (id, _previous, onCleanup) => {
  photoUrl.value = null
  if (!id) return

  let cancelled = false
  let objectUrl: string | undefined
  onCleanup(() => {
    cancelled = true
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  })

  try {
    const photo = await getProductPhoto(id)
    if (!photo || cancelled) return
    objectUrl = URL.createObjectURL(photo)
    photoUrl.value = objectUrl
  } catch {
    // Если файл недоступен, остаётся заглушка.
  }
}, { immediate: true })

const expiryLabel = computed(() => {
  const expiry = props.expiry
  if (expiry.status === 'unknown') return translate('expiryUnknown')
  if (expiry.status === 'expired') return translate('expiryExpired')
  if (expiry.status === 'today') return translate('expiryToday')

  const useMonths = expiry.remainingMonths > 0
  const value = useMonths ? expiry.remainingMonths : expiry.remainingDays
  const time = new Intl.NumberFormat(locale.value, {
    style: 'unit',
    unit: useMonths ? 'month' : 'day',
    unitDisplay: 'long',
  }).format(value)
  const singular = new Intl.PluralRules(locale.value).select(value) === 'one'
  return translate(singular ? 'expiryRemainingOne' : 'expiryRemaining').replace('{time}', time)
})
</script>

<template>
  <article class="product-card" :class="`product-card--${layout}`">
    <div class="product-card__photo">
      <img v-if="photoUrl" :src="photoUrl" alt="" loading="lazy" @error="photoUrl = null">
      <span v-else>{{ translate('noProductPhoto') }}</span>
    </div>
    <div class="product-card__body">
      <h3 :title="product.name">{{ product.name }}</h3>
      <span
        class="product-card__expiry"
        :class="{ 'product-card__expiry--warning': product.archivedAt === null && (expiringSoon || expiry.status === 'expired') }"
      >
        {{ expiryLabel }}
      </span>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.625rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.875rem;
  background: var(--color-surface);
}

.product-card--row {
  grid-template-columns: 4rem minmax(0, 1fr);
  align-items: center;
}

.product-card--tile {
  grid-template-columns: minmax(0, 1fr);
  box-sizing: border-box;
  block-size: 100%;
}

.product-card__photo {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 0.5rem;
  background: var(--color-photo-placeholder);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.product-card--tile .product-card__photo {
  aspect-ratio: 4 / 3;
}

.product-card__photo img {
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: 0;
  min-block-size: 0;
  object-fit: cover;
}

.product-card__body {
  min-inline-size: 0;
}

.product-card__body h3 {
  margin: 0 0 0.375rem;
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__expiry {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.product-card__expiry--warning {
  background: var(--color-expiry-warning-bg);
  color: var(--color-expiry-warning-text);
}
</style>
