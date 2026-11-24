<script setup lang="ts">
import { ref } from 'vue'
import BackupSettings from '../features/backup/BackupSettings.vue'
import { setUpcomingRitualHours, upcomingRitualHours } from '../features/rituals/upcomingRitualHours'
import { languages, locale, translate } from '../locales'
import { theme, themes } from '../theme'

const draftHours = ref<number | string>(upcomingRitualHours.value)
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
  </section>
</template>
