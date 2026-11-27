<script setup lang="ts">
import { ref } from 'vue'
import BackupSettings from '../features/backup/BackupSettings.vue'
import { archivePromptSeconds, maxArchivePromptSeconds, setArchivePromptSeconds } from '../features/products/archivePromptDuration'
import { expiryWarningDays, setExpiryWarningDays } from '../features/products/expiryWarningDays'
import { setUpcomingRitualHours, upcomingRitualHours } from '../features/rituals/upcomingRitualHours'
import { languages, locale, translate } from '../locales'
import { theme, themes } from '../theme'

const draftHours = ref<number | string>(upcomingRitualHours.value)
const draftPromptSeconds = ref<number | string>(archivePromptSeconds.value)
const draftExpiryWarningDays = ref<number | string>(expiryWarningDays.value)
</script>

<template>
  <section class="profile-settings" aria-labelledby="profile-settings-title">
    <h2 id="profile-settings-title">{{ translate('settings') }}</h2>
    <p>
      <label for="app-language">{{ translate('language') }}</label>
      <select id="app-language" v-model="locale">
        <option v-for="language in languages" :key="language.code" :value="language.code">
          {{ language.label }}
        </option>
      </select>
    </p>
    <p>
      <label for="app-theme">{{ translate('theme') }}</label>
      <select id="app-theme" v-model="theme">
        <option v-for="option in themes" :key="option.value" :value="option.value">
          {{ translate(option.label) }}
        </option>
      </select>
    </p>
    <form @submit.prevent="setUpcomingRitualHours(Number(draftHours))">
      <label for="upcoming-ritual-hours">{{ translate('upcomingRitualHoursSetting') }}</label>
      <input
        id="upcoming-ritual-hours"
        v-model.number="draftHours"
        type="number"
        min="1"
        :max="Number.MAX_SAFE_INTEGER"
        step="1"
        required
      >
      <button type="submit" :disabled="draftHours === upcomingRitualHours">{{ translate('save') }}</button>
    </form>
    <BackupSettings />
    <details class="advanced-settings">
      <summary>{{ translate('advancedSettings') }}</summary>
      <form @submit.prevent="setArchivePromptSeconds(Number(draftPromptSeconds))">
        <label for="archive-prompt-seconds">{{ translate('archivePromptDurationSetting') }}</label>
        <input
          id="archive-prompt-seconds"
          v-model.number="draftPromptSeconds"
          type="number"
          min="1"
          :max="maxArchivePromptSeconds"
          step="1"
          required
        >
        <button type="submit" :disabled="draftPromptSeconds === archivePromptSeconds">{{ translate('save') }}</button>
      </form>
      <form @submit.prevent="setExpiryWarningDays(Number(draftExpiryWarningDays))">
        <label for="expiry-warning-days">{{ translate('expiryWarningDaysSetting') }}</label>
        <input
          id="expiry-warning-days"
          v-model.number="draftExpiryWarningDays"
          type="number"
          min="0"
          :max="Number.MAX_SAFE_INTEGER"
          step="1"
          required
        >
        <button type="submit" :disabled="draftExpiryWarningDays === expiryWarningDays">{{ translate('save') }}</button>
      </form>
    </details>
  </section>
</template>

<style scoped>
.profile-settings {
  display: grid;
  gap: 0.75rem;
}

.profile-settings h2 {
  margin: 0 0 0.125rem;
  font-size: 1.35rem;
  letter-spacing: -0.025em;
}

.profile-settings > :is(p, form, section, details) {
  min-inline-size: 0;
  margin: 0;
  padding: 0.875rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.profile-settings > p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.profile-settings form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
}

.profile-settings form label {
  grid-column: 1 / -1;
}

.profile-settings :is(label, summary) {
  font-weight: 600;
}

.profile-settings > p select {
  max-inline-size: 100%;
}

.profile-settings :deep(h3) {
  margin-block: 0 0.625rem;
  font-size: 1rem;
}

.profile-settings :deep(button) {
  min-block-size: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
  color: var(--color-text);
}

.profile-settings :deep(button:disabled) {
  opacity: 0.6;
}

.profile-settings button[type='submit']:enabled {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.advanced-settings summary {
  cursor: pointer;
}

.advanced-settings form {
  margin-block-start: 1rem;
  padding-block-start: 0.875rem;
  border-block-start: 1px solid var(--color-divider);
}
</style>
