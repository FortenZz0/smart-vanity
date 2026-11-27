<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import EditorActions from '../components/EditorActions.vue'
import { getProductExpiry, parseCalendarDate } from '../features/products/expiry'
import type { ExpiryInput, Product, ShelfLifeUnit } from '../features/products/product'
import ProductIcon from '../features/products/ProductIcon.vue'
import { defaultProductIcon, productIconIds } from '../features/products/productIcons'
import { discardUnattachedProductPhoto, getProductPhoto, saveProductPhoto } from '../features/products/productPhotos'
import { deleteProduct, getProduct, saveProduct } from '../features/products/productRepository'
import { locale, translate } from '../locales'

const props = defineProps<{ productId?: string }>()
const router = useRouter()
const originalProduct = shallowRef<Product | null>(null)
const loadState = ref<'loading' | 'ready' | 'missing' | 'error'>(props.productId ? 'loading' : 'ready')
const name = ref('')
const note = ref('')
const finished = ref(false)
const openedOn = ref('')
const paoMonths = ref<number | ''>('')
const expiryMode = ref<ExpiryInput['kind']>('date')
const expiresOn = ref('')
const manufacturedOn = ref('')
const shelfDuration = ref<number | ''>('')
const shelfUnit = ref<ShelfLifeUnit>('months')
const photoInput = ref<HTMLInputElement | null>(null)
const iconPicker = ref<HTMLDialogElement | null>(null)
const iconId = ref<string | null>(null)
const photo = shallowRef<File | null>(null)
const storedPhotoId = ref<string | null>(null)
const photoUrl = ref<string | null>(null)
const photoLoading = ref(false)
const photoFailed = ref(false)
const hasPhoto = computed(() => !!photo.value || !!storedPhotoId.value)
const saving = ref(false)
const actionError = ref<'productSaveError' | 'productDeleteError' | null>(null)
const datesInvalid = ref(false)
let newProductId: string | undefined

async function loadProduct() {
  if (!props.productId) return

  loadState.value = 'loading'
  try {
    const product = await getProduct(props.productId)
    if (!product) {
      loadState.value = 'missing'
      return
    }

    originalProduct.value = product
    name.value = product.name
    note.value = product.note
    finished.value = product.finished
    openedOn.value = product.openedOn ?? ''
    paoMonths.value = product.paoMonths ?? ''
    storedPhotoId.value = product.photoId
    iconId.value = product.iconId
    const expiry = product.expiry
    if (expiry?.kind === 'date') expiresOn.value = expiry.expiresOn
    if (expiry?.kind === 'shelfLife') {
      expiryMode.value = expiry.kind
      manufacturedOn.value = expiry.manufacturedOn
      shelfDuration.value = expiry.duration
      shelfUnit.value = expiry.unit
    }
    loadState.value = 'ready'
  } catch (error) {
    console.error('Failed to load the product', error)
    loadState.value = 'error'
  }
}

onMounted(loadProduct)

watch([photo, storedPhotoId], async ([file, id], _, onCleanup) => {
  photoUrl.value = null
  photoLoading.value = file !== null || id !== null
  if (!file && !id) return

  let cancelled = false
  let url: string | undefined
  onCleanup(() => {
    cancelled = true
    if (url) URL.revokeObjectURL(url)
  })

  try {
    const image = file ?? (id ? await getProductPhoto(id) : null)
    if (cancelled) return
    if (!image) {
      failPhotoPreview()
      return
    }
    url = URL.createObjectURL(image)
    photoUrl.value = url
  } catch {
    if (!cancelled) failPhotoPreview()
  }
}, { flush: 'post' })

function selectPhoto(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  photoFailed.value = !file.type.startsWith('image/') || file.size === 0
  if (!photoFailed.value) photo.value = file
}

function removePhoto() {
  photo.value = null
  storedPhotoId.value = null
  photoFailed.value = false
}

function selectIcon(id: string) {
  iconId.value = id
  iconPicker.value?.close()
}

function failPhotoPreview() {
  photo.value = null
  photoUrl.value = null
  photoLoading.value = false
  photoFailed.value = true
}

function isPositiveInteger(value: number | ''): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

type ExpiryFields = Pick<Product, 'openedOn' | 'paoMonths' | 'expiry'>

const checkedExpiry = computed(() => {
  const openingDate = parseCalendarDate(openedOn.value)
  const pao = paoMonths.value
  if (openedOn.value && !openingDate) return null
  if (pao !== '' && !isPositiveInteger(pao)) return null

  let expiry: ExpiryInput | null = null
  if (expiryMode.value === 'date') {
    const date = parseCalendarDate(expiresOn.value)
    if (expiresOn.value && !date) return null
    if (date) expiry = { kind: 'date', expiresOn: date }
  } else {
    const date = parseCalendarDate(manufacturedOn.value)
    if (!date || !isPositiveInteger(shelfDuration.value)) return null
    expiry = { kind: 'shelfLife', manufacturedOn: date, duration: shelfDuration.value, unit: shelfUnit.value }
  }

  const fields: ExpiryFields = { openedOn: openingDate, paoMonths: pao === '' ? null : pao, expiry }
  try {
    return { fields, date: getProductExpiry(fields).expiresOn }
  } catch (error) {
    if (error instanceof RangeError) return null
    throw error
  }
})

const expiryPreview = computed(() => {
  const date = checkedExpiry.value?.date
  return date && new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
})

async function discardPhoto(id: string) {
  await discardUnattachedProductPhoto(id).catch((error: unknown) => {
    console.error('Failed to discard the unused product photo', error)
  })
}

function goBack() {
  if (router.options.history.state.back) {
    router.back()
  } else {
    void router.replace({ name: 'home' })
  }
}

async function removeProduct() {
  const product = originalProduct.value
  if (!product || saving.value || !window.confirm(translate('confirmDeleteProduct'))) return

  const submittedFrom = router.currentRoute.value
  saving.value = true
  actionError.value = null

  try {
    await deleteProduct(product.id)
    if (product.photoId) await discardPhoto(product.photoId)
    if (router.currentRoute.value === submittedFrom) {
      await router.replace({ name: 'home' })
    }
  } catch (error) {
    console.error('Failed to delete the product', error)
    actionError.value = 'productDeleteError'
  } finally {
    saving.value = false
  }
}

async function submitProduct(event: SubmitEvent) {
  if (loadState.value !== 'ready' || !name.value || saving.value || photoLoading.value) return

  const expiry = checkedExpiry.value
  datesInvalid.value = !expiry
  if (!expiry) return

  const submittedFrom = router.currentRoute.value
  const original = originalProduct.value
  const action = event.submitter?.getAttribute('value')
  let archivedAt = original?.archivedAt ?? null
  if (original && action === 'archive' && archivedAt === null) archivedAt = new Date().toISOString()
  if (action === 'restore') archivedAt = null
  saving.value = true
  actionError.value = null
  let addedPhoto: string | null = null

  try {
    const id = original?.id ?? (newProductId ??= crypto.randomUUID())
    if (photo.value) addedPhoto = await saveProductPhoto(photo.value)
    const photoId = addedPhoto ?? storedPhotoId.value
    await saveProduct({
      id,
      name: name.value,
      note: note.value,
      photoId,
      iconId: iconId.value,
      ...expiry.fields,
      archivedAt,
      finished: finished.value,
    })
    if (original?.photoId && original.photoId !== photoId) await discardPhoto(original.photoId)
    if (router.currentRoute.value === submittedFrom) {
      await router.replace({ name: 'home' })
    }
  } catch (error) {
    if (addedPhoto) await discardPhoto(addedPhoto)
    console.error('Failed to save the product', error)
    actionError.value = 'productSaveError'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <button class="product-editor__back" type="button" @click="goBack">
      <span aria-hidden="true">←</span> {{ translate('back') }}
    </button>
    <h1>{{ translate(productId ? 'editProduct' : 'addProduct') }}</h1>
    <p v-if="loadState === 'loading'" role="status">{{ translate('productLoading') }}</p>
    <div v-else-if="loadState === 'missing'">
      <p role="alert">{{ translate('productNotFound') }}</p>
      <RouterLink :to="{ name: 'home' }" replace>{{ translate('home') }}</RouterLink>
    </div>
    <div v-else-if="loadState === 'error'">
      <p role="alert">{{ translate('productLoadError') }}</p>
      <button type="button" @click="loadProduct">{{ translate('tryAgain') }}</button>
    </div>
    <form v-else class="product-form" @submit.prevent="submitProduct">
      <div class="product-form__photo">
        <div class="product-form__photo-control">
          <div class="product-form__preview">
            <img
              v-if="photoUrl"
              :key="photoUrl"
              :src="photoUrl"
              alt=""
              @load="photoLoading = false"
              @error="failPhotoPreview"
            >
            <ProductIcon v-else :icon-id="iconId" />
          </div>
          <button
            v-if="hasPhoto"
            class="product-form__remove-photo"
            type="button"
            :aria-label="translate('removeProductPhoto')"
            :disabled="saving"
            @click="removePhoto"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div class="product-form__photo-actions">
          <button type="button" :disabled="saving" @click="iconPicker?.showModal()">
            {{ translate('chooseProductIcon') }}
          </button>
          <button type="button" :disabled="saving" @click="photoInput?.click()">
            {{ translate(hasPhoto ? 'replaceProductPhoto' : 'chooseProductPhoto') }}
          </button>
        </div>
        <dialog ref="iconPicker" class="product-form__icon-picker" aria-labelledby="product-icon-title">
          <div class="product-form__icon-picker-header">
            <h2 id="product-icon-title">{{ translate('chooseProductIcon') }}</h2>
            <button type="button" @click="iconPicker?.close()">
              {{ translate('closeProductIconPicker') }}
            </button>
          </div>
          <p v-if="hasPhoto">{{ translate('productIconPhotoHint') }}</p>
          <div class="product-form__icon-grid">
            <button
              v-for="id in productIconIds"
              :key="id"
              type="button"
              :aria-label="translate(`productIcon.${id}`)"
              :aria-pressed="id === (iconId ?? defaultProductIcon)"
              @click="selectIcon(id)"
            >
              <ProductIcon :icon-id="id" />
            </button>
          </div>
        </dialog>
        <input ref="photoInput" type="file" accept="image/*" hidden :disabled="saving" @change="selectPhoto">
        <p v-if="photoFailed" role="alert">{{ translate('productPhotoError') }}</p>
      </div>

      <fieldset class="product-form__fields" :disabled="saving">
        <label class="product-form__field">
          <span>{{ translate('productName') }}</span>
          <input id="product-name" v-model.trim="name" name="name" required>
        </label>
        <label class="product-form__field">
          <span>{{ translate('productNote') }}</span>
          <textarea id="product-note" v-model="note" rows="3"></textarea>
        </label>
        <label>
          <input v-model="finished" type="checkbox">
          {{ translate('productFinished') }}
        </label>
        <label class="product-form__field">
          <span>{{ translate('productOpenedOn') }}</span>
          <input id="product-opened-on" v-model="openedOn" type="date">
        </label>
        <label class="product-form__field">
          <span>{{ translate('productPaoMonths') }}</span>
          <input id="product-pao" v-model.number="paoMonths" type="number" min="1" step="1">
        </label>
        <fieldset class="expiry-toggle">
          <legend>{{ translate('productExpiryMode') }}</legend>
          <div class="expiry-toggle__options">
            <label>
              <input v-model="expiryMode" type="radio" name="expiry-mode" value="date">
              <span>{{ translate('productExpiresOn') }}</span>
            </label>
            <label>
              <input v-model="expiryMode" type="radio" name="expiry-mode" value="shelfLife">
              <span>{{ translate('productExpiryFromManufacture') }}</span>
            </label>
          </div>
        </fieldset>
        <label v-if="expiryMode === 'date'" class="product-form__field">
          <span>{{ translate('productExpiresOn') }}</span>
          <input id="product-expires-on" v-model="expiresOn" type="date">
        </label>
        <template v-else>
          <label class="product-form__field">
            <span>{{ translate('productManufacturedOn') }}</span>
            <input id="product-manufactured-on" v-model="manufacturedOn" type="date" required>
          </label>
          <label class="product-form__field">
            <span>{{ translate('productShelfDuration') }}</span>
            <input id="product-shelf-duration" v-model.number="shelfDuration" type="number" min="1" step="1" required>
          </label>
          <label class="product-form__field">
            <span>{{ translate('productShelfUnit') }}</span>
            <select id="product-shelf-unit" v-model="shelfUnit">
              <option value="days">{{ translate('productShelfDays') }}</option>
              <option value="months">{{ translate('productShelfMonths') }}</option>
              <option value="years">{{ translate('productShelfYears') }}</option>
            </select>
          </label>
        </template>

        <p v-if="expiryPreview">{{ translate('productEffectiveExpiry').replace('{date}', expiryPreview) }}</p>
        <p v-if="datesInvalid && !checkedExpiry" role="alert">{{ translate('productDatesInvalid') }}</p>

        <EditorActions
          :archive-action="originalProduct ? (originalProduct.archivedAt === null ? 'archive' : 'restore') : undefined"
          :submit-disabled="!name || saving || photoLoading"
          @delete="removeProduct"
        />
        <p v-if="actionError" role="alert">{{ translate(actionError) }}</p>
      </fieldset>
    </form>
  </section>
</template>

<style scoped>
.product-editor__back {
  margin-block-end: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: var(--color-accent);
  cursor: pointer;
  font: inherit;
}

.product-form {
  display: grid;
  gap: 1rem;
  margin-block-start: 1rem;
}

.product-form__photo {
  display: grid;
  justify-self: center;
  justify-items: center;
  gap: 0.5rem;
  text-align: center;
}

.product-form__photo-control {
  position: relative;
}

.product-form__preview {
  display: grid;
  inline-size: 9rem;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: var(--radius-card);
  background: var(--color-photo-placeholder);
  color: var(--color-text-muted);
}

.product-form__preview img {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 0;
  object-fit: cover;
}

.product-form__remove-photo {
  position: absolute;
  inset-block-start: 0.25rem;
  inset-inline-end: 0.25rem;
  display: grid;
  inline-size: 2rem;
  block-size: 2rem;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-divider);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
}

.product-form__photo-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.product-form__photo-actions button,
.product-form__icon-picker button {
  min-block-size: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.product-form__icon-picker {
  box-sizing: border-box;
  inline-size: min(22rem, calc(100% - 2rem));
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text);
  text-align: start;
}

.product-form__icon-picker::backdrop {
  background: rgb(0 0 0 / 45%);
}

.product-form__icon-picker-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-block-end: 0.75rem;
}

.product-form__icon-picker-header h2 {
  margin: 0;
  font-size: 1rem;
}

.product-form__icon-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.product-form__icon-grid button {
  display: grid;
  min-block-size: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  padding: 0;
}

.product-form__icon-grid button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-selected-bg);
}

.product-form__fields {
  display: grid;
  min-inline-size: 0;
  max-inline-size: 30rem;
  margin: 0;
  padding: clamp(0.75rem, 3vw, 1.25rem);
  gap: 1rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  text-align: start;
}

.product-form__field {
  display: grid;
  gap: 0.375rem;
}

.product-form__field > span,
.expiry-toggle legend {
  font-weight: 600;
}

.expiry-toggle {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.expiry-toggle legend {
  margin-block-end: 0.375rem;
  padding: 0;
}

.expiry-toggle__options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
}

.expiry-toggle__options label {
  position: relative;
  display: block;
  cursor: pointer;
}

.expiry-toggle__options input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  opacity: 0;
}

.expiry-toggle__options span {
  display: grid;
  min-block-size: 2rem;
  align-items: center;
  padding-inline: 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.expiry-toggle__options input:checked + span {
  background: var(--color-selected-bg);
  font-weight: 600;
}

.expiry-toggle__options input:focus-visible + span {
  outline: 2px solid var(--color-accent);
}

.product-form p {
  margin: 0;
}
</style>
