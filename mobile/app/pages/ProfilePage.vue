<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import profileIcon from '../../assets/icons/person.svg'
import { translate } from '../locales'

const nameKey = 'smart-vanity.profile-name'
const photoKey = 'smart-vanity.profile-photo'
const profileIconMask = `url(${JSON.stringify(profileIcon)})`
const name = ref('')
const photo = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const savingPhoto = ref(false)
const nameFailed = ref(false)
const photoFailed = ref(false)

try {
  name.value = localStorage.getItem(nameKey) ?? ''
  photo.value = localStorage.getItem(photoKey) ?? ''
} catch {
  // The profile can still be displayed when local storage is unavailable.
}

function saveName(event: Event) {
  name.value = (event.currentTarget as HTMLInputElement).value
  try {
    localStorage.setItem(nameKey, name.value)
    nameFailed.value = false
  } catch {
    nameFailed.value = true
  }
}

async function changePhoto(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || savingPhoto.value) return

  savingPhoto.value = true
  photoFailed.value = false
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(side, 384)
    const context = canvas.getContext('2d')
    if (!context || !side) throw new Error('Could not render profile photo')

    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2,
      side, side, 0, 0, canvas.width, canvas.height)
    const thumbnail = canvas.toDataURL('image/webp', 0.85)
    localStorage.setItem(photoKey, thumbnail)
    photo.value = thumbnail
  } catch {
    photoFailed.value = true
  } finally {
    URL.revokeObjectURL(url)
    savingPhoto.value = false
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
        :disabled="savingPhoto"
        @click="photoInput?.click()"
      >
        <img v-if="photo" :src="photo" alt="" />
        <span v-else class="profile-photo__placeholder" aria-hidden="true"></span>
      </button>
      <p v-if="photoFailed" class="profile-error" role="alert">{{ translate('profilePhotoError') }}</p>
      <input
        class="profile-name"
        type="text"
        autocomplete="name"
        :aria-label="translate('profileName')"
        :placeholder="translate('profileGuest')"
        :value="name"
        @input="saveName"
      />
      <p v-if="nameFailed" class="profile-error" role="alert">{{ translate('profileNameError') }}</p>
    </div>
    <p><RouterLink :to="{ name: 'settings' }">{{ translate('settings') }}</RouterLink></p>
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

.profile-error {
  margin: 0;
  color: var(--color-expiry-warning-text);
  text-align: center;
}
</style>
