<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import archiveIcon from '../../../assets/icons/archive.svg'
import openIcon from '../../../assets/icons/lock_open.svg'
import restoreIcon from '../../../assets/icons/unarchive.svg'
import { locale, translate } from '../../locales'
import type { ProductExpiry } from './expiry'
import type { Product } from './product'
import ProductIcon from './ProductIcon.vue'
import { getProductPhoto } from './productPhotos'

const props = defineProps<{
  product: Product
  expiry: ProductExpiry
  expiringSoon: boolean
  layout: 'row' | 'tile'
  actionPending?: boolean
}>()

const actions = {
  open: { icon: openIcon, label: 'openProduct' },
  archive: { icon: archiveIcon, label: 'moveToArchive' },
  restore: { icon: restoreIcon, label: 'restoreFromArchive' },
} as const

defineEmits<{ quickAction: [action: keyof typeof actions] }>()

const quickAction = computed(() => {
  if (props.product.archivedAt !== null) return 'restore'
  return props.layout === 'row' && props.product.openedOn === null ? 'open' : 'archive'
})
const actionIcon = computed(() => actions[quickAction.value].icon)
const actionLabel = computed(() => translate(actions[quickAction.value].label))

const expiryClass = computed(() => {
  if (props.product.finished || props.product.archivedAt !== null) return
  if (props.expiry.status === 'expired') return 'product-card__expiry--warning'
  if (props.expiringSoon) return 'product-card__expiry--soon'
  if (props.expiry.status === 'upcoming') return 'product-card__expiry--ok'
})

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
      <ProductIcon v-else :icon-id="product.iconId" />
    </div>
    <div class="product-card__body">
      <h3 :title="product.name">
        <RouterLink class="product-card-link" :to="{ name: 'edit-product', params: { productId: product.id } }">
          {{ product.name }}
        </RouterLink>
      </h3>
      <span
        class="product-card__expiry"
        :class="expiryClass"
      >
        {{ product.finished ? translate('productFinished') : expiryLabel }}
      </span>
    </div>
    <button
      v-if="layout === 'row' || product.archivedAt === null"
      class="product-card__action"
      type="button"
      :aria-label="actionLabel"
      :title="actionLabel"
      :disabled="actionPending"
      @click="$emit('quickAction', quickAction)"
    >
      <span :style="{ maskImage: `url(${JSON.stringify(actionIcon)})` }" aria-hidden="true"></span>
    </button>
  </article>
</template>

<style scoped>
.product-card-link {
  color: inherit;
  text-decoration: none;
}

.product-card-link::after {
  position: absolute;
  inset: 0;
  border-radius: 0.875rem;
  content: '';
}

.product-card-link:focus-visible::after {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.product-card {
  position: relative;
  isolation: isolate;
  display: grid;
  gap: 0.75rem;
  padding: 0.625rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.875rem;
  background: var(--color-surface);
}

.product-card--row {
  grid-template-columns: 4rem minmax(0, 1fr) 3.75rem;
  align-items: center;
}

.product-card--tile {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  column-gap: 0;
  box-sizing: border-box;
  block-size: 100%;
}

.product-card__action {
  position: relative;
  z-index: 1;
  display: grid;
  align-self: stretch;
  justify-self: stretch;
  min-inline-size: 0;
  min-block-size: 2.75rem;
  margin: 0.125rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.product-card--row .product-card__action {
  grid-column: 3;
}

.product-card--tile .product-card__action {
  grid-column: 2;
  grid-row: 2;
}

.product-card__action:disabled {
  opacity: 0.55;
  cursor: default;
}

.product-card__action span {
  inline-size: min(80%, 2.5rem);
  aspect-ratio: 1;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.product-card--row .product-card__action span {
  inline-size: min(80%, 3rem);
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
  grid-column: 1 / -1;
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
  container-type: inline-size;
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
  box-sizing: border-box;
  max-inline-size: 100%;
  overflow: hidden;
  padding: 0.25rem 0.5rem;
  padding-inline: min(0.5rem, 5cqi);
  border-radius: 0.375rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-size: min(0.75rem, 9.5cqi);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__expiry--warning {
  background: var(--color-expiry-warning-bg);
  color: var(--color-expiry-warning-text);
}

.product-card__expiry--soon {
  background: var(--color-expiry-soon-bg);
  color: var(--color-expiry-soon-text);
}

.product-card__expiry--ok {
  background: var(--color-expiry-ok-bg);
  color: var(--color-expiry-ok-text);
}
</style>
