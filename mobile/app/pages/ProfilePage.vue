<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef } from 'vue'
import profileIcon from '../../assets/icons/person.svg'
import ProfileSettings from '../components/ProfileSettings.vue'
import { translate } from '../locales'

const nameKey = 'smart-vanity.profile-name'
const photoKey = 'smart-vanity.profile-photo'
const profileIconMask = `url(${JSON.stringify(profileIcon)})`
const name = ref('')
const photo = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const draftUrl = ref('')
const draftImage = shallowRef<HTMLImageElement | null>(null)
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const nameFailed = ref(false)
const photoFailed = ref(false)
let dragPosition = { x: 0, y: 0 }

const crop = computed(() => {
  const image = draftImage.value
  if (!image) return null

  const side = Math.min(image.naturalWidth, image.naturalHeight) / zoom.value
  const width = image.naturalWidth / side
  const height = image.naturalHeight / side
  const limitX = (width - 1) / 2
  const limitY = (height - 1) / 2
  const x = Math.max(-limitX, Math.min(limitX, offset.value.x))
  const y = Math.max(-limitY, Math.min(limitY, offset.value.y))
  return { side, width, height, x, y }
})

function normalizeName(value: string): string {
  return /^[\s\p{Default_Ignorable_Code_Point}\p{Cc}]*$/u.test(value) ? '' : value.trim()
}

try {
  name.value = normalizeName(localStorage.getItem(nameKey) ?? '')
  photo.value = localStorage.getItem(photoKey) ?? ''
} catch {
  // The profile can still be displayed when local storage is unavailable.
}

function saveName(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const normalized = normalizeName(input.value)
  if (event.type === 'blur') input.value = normalized
  name.value = input.value
  try {
    if (normalized) localStorage.setItem(nameKey, normalized)
    else localStorage.removeItem(nameKey)
    nameFailed.value = false
  } catch {
    nameFailed.value = true
  }
}

async function changePhoto(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || draftUrl.value) return

  photoFailed.value = false
  const url = URL.createObjectURL(file)
  draftUrl.value = url
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (draftUrl.value !== url) return
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Invalid profile photo')
    draftImage.value = image
  } catch {
    if (draftUrl.value !== url) return
    closePhotoEditor()
    photoFailed.value = true
  }
}

function closePhotoEditor() {
  if (draftUrl.value) URL.revokeObjectURL(draftUrl.value)
  draftUrl.value = ''
  draftImage.value = null
  zoom.value = 1
  offset.value = { x: 0, y: 0 }
  photoFailed.value = false
}

onUnmounted(closePhotoEditor)

function movePhoto(dx: number, dy: number) {
  const frame = crop.value
  if (!frame) return
  offset.value = { x: frame.x + dx, y: frame.y + dy }
  const clamped = crop.value!
  offset.value = { x: clamped.x, y: clamped.y }
}

function startPhotoDrag(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return
  const frame = event.currentTarget as HTMLElement
  frame.setPointerCapture(event.pointerId)
  dragPosition = { x: event.clientX, y: event.clientY }
}

function dragPhoto(event: PointerEvent) {
  const frame = event.currentTarget as HTMLElement
  if (!frame.hasPointerCapture(event.pointerId)) return
  const size = frame.getBoundingClientRect().width
  if (size) movePhoto((event.clientX - dragPosition.x) / size, (event.clientY - dragPosition.y) / size)
  dragPosition = { x: event.clientX, y: event.clientY }
}

function savePhoto() {
  const image = draftImage.value
  const frame = crop.value
  if (!image || !frame) return

  try {
    const { side, x, y } = frame
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(side, 384)
    const context = canvas.getContext('2d')
    if (!context || !side) throw new Error('Could not render profile photo')

    context.drawImage(image, (image.naturalWidth - side) / 2 - x * side,
      (image.naturalHeight - side) / 2 - y * side,
      side, side, 0, 0, canvas.width, canvas.height)
    const thumbnail = canvas.toDataURL('image/webp', 0.85)
    localStorage.setItem(photoKey, thumbnail)
    photo.value = thumbnail
    closePhotoEditor()
  } catch {
    photoFailed.value = true
  }
}
</script>

<template>
  <section>
    <h1>{{ translate('profile') }}</h1>
    <div class="profile-details">
      <input ref="photoInput" type="file" accept="image/*" hidden @change="changePhoto" />
      <button
        class="profile-photo"
        type="button"
        :aria-label="translate('profileChangePhoto')"
        :disabled="!!draftUrl"
        @click="photoInput?.click()"
      >
        <img v-if="photo" :src="photo" alt="" />
        <span v-else class="profile-photo__placeholder" aria-hidden="true"></span>
      </button>
      <section v-if="crop" class="photo-editor" aria-labelledby="photo-editor-title">
        <h2 id="photo-editor-title">{{ translate('profileCropPhoto') }}</h2>
        <div
          class="photo-editor__frame"
          tabindex="0"
          role="group"
          :aria-label="translate('profilePositionPhoto')"
          @pointerdown="startPhotoDrag"
          @pointermove="dragPhoto"
          @keydown.left.prevent="movePhoto(-0.025, 0)"
          @keydown.right.prevent="movePhoto(0.025, 0)"
          @keydown.up.prevent="movePhoto(0, -0.025)"
          @keydown.down.prevent="movePhoto(0, 0.025)"
        >
          <img
            :src="draftUrl"
            alt=""
            draggable="false"
            :style="{
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`,
              left: `${(0.5 + crop.x) * 100}%`,
              top: `${(0.5 + crop.y) * 100}%`,
            }"
          />
        </div>
        <label class="photo-editor__zoom">
          {{ translate('profilePhotoZoom') }}
          <input v-model.number="zoom" type="range" min="1" max="4" step="0.01" />
        </label>
        <div class="photo-editor__actions">
          <button type="button" @click="closePhotoEditor">{{ translate('cancel') }}</button>
          <button type="button" @click="savePhoto">{{ translate('save') }}</button>
        </div>
      </section>
      <p v-if="photoFailed" class="profile-error" role="alert">{{ translate('profilePhotoError') }}</p>
      <input
        class="profile-name"
        type="text"
        autocomplete="name"
        :aria-label="translate('profileName')"
        :placeholder="translate('profileNamePlaceholder')"
        :value="name"
        @input="saveName"
        @blur="saveName"
      />
      <p v-if="nameFailed" class="profile-error" role="alert">{{ translate('profileNameError') }}</p>
    </div>
    <ProfileSettings />
  </section>
</template>

<style scoped>
.profile-details {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  margin-block: 1rem;
}

.profile-photo {
  display: grid;
  place-items: center;
  inline-size: 7rem;
  aspect-ratio: 1;
  overflow: hidden;
  padding: 0;
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  background: var(--color-photo-placeholder);
  color: var(--color-text-muted);
  cursor: pointer;
}

.profile-photo img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.profile-photo__placeholder {
  inline-size: 3rem;
  block-size: 3rem;
  background-color: currentColor;
  mask: v-bind(profileIconMask) center / contain no-repeat;
}

.profile-name {
  box-sizing: border-box;
  inline-size: min(100%, 18rem);
  min-block-size: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-text-muted);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: center;
}

.profile-name::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.photo-editor {
  display: grid;
  gap: 0.75rem;
  inline-size: min(100%, 18rem);
}

.photo-editor h2 {
  margin: 0;
  font-size: 1rem;
}

.photo-editor__frame {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-photo-placeholder);
  touch-action: none;
  cursor: grab;
}

.photo-editor__frame img {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.photo-editor__frame::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px white, 0 0 0 20rem rgb(0 0 0 / 65%);
  content: '';
  pointer-events: none;
}

.photo-editor__zoom {
  display: grid;
  gap: 0.25rem;
}

.photo-editor__zoom input {
  min-block-size: 2rem;
  accent-color: var(--color-accent);
}

.photo-editor__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.photo-editor__actions button {
  min-block-size: 2.75rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.photo-editor__actions button:last-child {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.profile-error {
  margin: 0;
  color: var(--color-expiry-warning-text);
  text-align: center;
}
</style>
