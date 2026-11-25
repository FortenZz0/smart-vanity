<script setup lang="ts">
import { ref } from 'vue'
import BackupSettings from '../features/backup/BackupSettings.vue'
import DemoSettings from '../features/demo/DemoSettings.vue'
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
  <section>
    <h1>{{ translate('settings') }}</h1>
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
    <DemoSettings />
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
.advanced-settings {
  margin-block-start: 1.5rem;
}

.advanced-settings form {
  margin-block-start: 0.75rem;
}
</style>
