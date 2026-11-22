<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import editIcon from '../../assets/icons/edit.svg'
import personIcon from '../../assets/icons/person.svg'
import { translate } from '../locales'

const nameStorageKey = 'smart-vanity.profile-name'

function readName() {
  try {
    return localStorage.getItem(nameStorageKey) ?? ''
  } catch {
    return ''
  }
}

const name = ref(readName())
const draftName = ref(name.value)
const editing = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

function startEditing() {
  if (editing.value) return
  draftName.value = name.value || translate('profileGuestName')
  editing.value = true
}

function focusName() {
  startEditing()
  nameInput.value?.focus()
}

function saveName() {
  if (!editing.value) return
  const enteredName = draftName.value.trim()
  const savedName = !name.value && enteredName === translate('profileGuestName') ? '' : enteredName
  name.value = savedName
  draftName.value = savedName
  editing.value = false

  try {
    localStorage.setItem(nameStorageKey, savedName)
  } catch {
    // При недоступном хранилище имя остаётся на открытом экране.
  }
}

function finishEditing(event: KeyboardEvent) {
  if (event.isComposing) return
  event.preventDefault()
  if (event.key === 'Escape') draftName.value = name.value
  saveName()
  if (event.currentTarget instanceof HTMLInputElement) event.currentTarget.blur()
}
</script>

<template>
  <section>
    <h1>{{ translate('profile') }}</h1>
    <div class="profile__identity">
      <div class="profile__avatar" aria-hidden="true">
        <span class="profile__icon" :style="{ maskImage: `url(${JSON.stringify(personIcon)})` }"></span>
      </div>
      <label class="profile__name" :class="{ 'profile__name--editing': editing }" @click="focusName">
        <span class="profile__name-field">
          <span class="profile__name-text" aria-hidden="true">
            {{ (editing ? draftName : name) || translate('profileGuestName') }}
          </span>
          <input
            ref="nameInput"
            v-model="draftName"
            type="text"
            autocomplete="off"
            enterkeyhint="done"
            :aria-label="translate('profileName')"
            :placeholder="translate('profileGuestName')"
            @focus="startEditing"
            @blur="saveName"
            @keydown.enter="finishEditing"
            @keydown.esc="finishEditing"
          >
        </span>
        <span
          class="profile__icon profile__edit-icon"
          :style="{ maskImage: `url(${JSON.stringify(editIcon)})` }"
          aria-hidden="true"
        ></span>
      </label>
    </div>
    <div class="profile__auth">
      <RouterLink :to="{ name: 'auth' }">{{ translate('authSignIn') }}</RouterLink>
      <RouterLink :to="{ name: 'auth', query: { mode: 'register' } }">
        {{ translate('authRegister') }}
      </RouterLink>
    </div>
    <p><RouterLink :to="{ name: 'settings' }">{{ translate('settings') }}</RouterLink></p>
  </section>
</template>

<style scoped>
.profile__identity {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  gap: 0.5rem;
  margin-block-start: 1rem;
}

.profile__avatar {
  display: grid;
  inline-size: 6rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: var(--color-selected-bg);
  color: var(--color-text);
}

.profile__icon {
  inline-size: 4rem;
  aspect-ratio: 1;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.profile__name {
  display: flex;
  box-sizing: border-box;
  min-block-size: 2.75rem;
  max-inline-size: 100%;
  align-items: center;
  gap: 0.5rem;
  padding-inline: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  -webkit-tap-highlight-color: transparent;
}

.profile__name-field {
  position: relative;
  display: block;
  min-inline-size: 0;
}

.profile__name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile__edit-icon {
  flex: none;
  inline-size: 1.125rem;
  color: var(--color-text-muted);
  /* Рисунок внутри SVG расположен выше центра. */
  transform: translateY(0.125rem);
}

.profile__name input {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  border: 0;
  border-radius: 0;
  outline: 0;
  outline-offset: 0;
  background: none;
  box-shadow: none;
  color: inherit;
  opacity: 0;
  cursor: text;
  font: inherit;
}

.profile__name--editing .profile__name-field::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: -2px;
  block-size: 1px;
  background: var(--color-accent);
  pointer-events: none;
  content: '';
}

.profile__name--editing .profile__name-text {
  visibility: hidden;
}

.profile__name--editing input {
  opacity: 1;
}

.profile__auth {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  max-inline-size: 28rem;
  margin: 1rem auto 0;
}

.profile__auth a {
  display: grid;
  min-block-size: 2.75rem;
  place-items: center;
  padding: 0.25rem;
  border: 1px solid var(--color-accent);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-accent);
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.profile__auth a:first-child {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
</style>
