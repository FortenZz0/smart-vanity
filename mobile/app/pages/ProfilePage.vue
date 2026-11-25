<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { translate } from '../locales'
</script>

<template>
  <section>
    <h1>{{ translate('profile') }}</h1>
    <p><RouterLink :to="{ name: 'rituals' }">{{ translate('rituals') }}</RouterLink></p>
    <p><RouterLink :to="{ name: 'settings' }">{{ translate('settings') }}</RouterLink></p>
  </section>
</template>
