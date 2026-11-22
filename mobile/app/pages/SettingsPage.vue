<script setup lang="ts">
import { languages, locale, translate } from '../locales'
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
  </section>
</template>
