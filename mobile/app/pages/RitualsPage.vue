<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { translate } from '../locales'
</script>

<template>
  <section>
    <h1>{{ translate('rituals') }}</h1>
    <p><RouterLink :to="{ name: 'create-ritual' }">{{ translate('createRitual') }}</RouterLink></p>
  </section>
</template>
