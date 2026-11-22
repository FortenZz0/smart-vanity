<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { translate } from '../locales'

const route = useRoute()
const router = useRouter()
const submitted = ref(false)

const mode = computed<'sign-in' | 'register'>({
  get: () => route.query.mode === 'register' ? 'register' : 'sign-in',
  set: (value) => {
    void router.replace({ name: 'auth', query: value === 'register' ? { mode: value } : {} })
  },
})
const registering = computed(() => mode.value === 'register')
watch(mode, () => { submitted.value = false })
</script>

<template>
  <section class="auth" :aria-label="translate('authMode')">
    <fieldset class="auth__toggle" :aria-label="translate('authMode')">
      <label>
        <input v-model="mode" type="radio" name="auth-mode" value="sign-in">
        <span>{{ translate('authSignIn') }}</span>
      </label>
      <label>
        <input v-model="mode" type="radio" name="auth-mode" value="register">
        <span>{{ translate('authRegister') }}</span>
      </label>
    </fieldset>

    <form :key="mode" class="auth__form" @submit.prevent="submitted = true">
      <label v-if="registering" class="auth__field">
        {{ translate('profileName') }}
        <input type="text" autocomplete="name" required>
      </label>
      <label class="auth__field">
        {{ translate('authEmail') }}
        <input type="email" autocomplete="email" autocapitalize="none" required>
      </label>
      <label class="auth__field">
        {{ translate('authPassword') }}
        <input type="password" :autocomplete="registering ? 'new-password' : 'current-password'" required>
      </label>
      <button type="submit">{{ translate(registering ? 'authRegister' : 'authSignIn') }}</button>
      <div role="status">
        <p v-if="submitted">{{ translate('authUnavailable') }}</p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.auth {
  display: grid;
  gap: 1.25rem;
  max-inline-size: 28rem;
  margin-inline: auto;
}

.auth__toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
  min-inline-size: 0;
  margin: 0;
  padding: 0.25rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.75rem;
  background: var(--color-surface);
}

.auth__toggle label {
  position: relative;
  display: grid;
  cursor: pointer;
}

.auth__toggle input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  opacity: 0;
}

.auth__toggle span {
  display: grid;
  min-block-size: 2.75rem;
  place-items: center;
  padding-inline: 0.25rem;
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
  overflow-wrap: anywhere;
}

.auth__toggle input:checked + span {
  background: var(--color-selected-bg);
  color: var(--color-text);
  font-weight: 600;
}

.auth__toggle input:focus-visible + span {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.auth__form,
.auth__field {
  display: grid;
  min-inline-size: 0;
}

.auth__form {
  gap: 1rem;
}

.auth__field {
  gap: 0.375rem;
}

.auth__field input,
.auth__form button {
  box-sizing: border-box;
  min-inline-size: 0;
  min-block-size: 2.75rem;
  padding: 0.625rem;
  border-radius: 0.5rem;
  font: inherit;
}

.auth__field input {
  border: 1px solid var(--color-text-muted);
  background: var(--color-surface);
  color: var(--color-text);
}

.auth__form button {
  border: 0;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 600;
}

.auth__form p {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
