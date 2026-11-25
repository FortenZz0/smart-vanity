<script setup lang="ts">
import { getProductIcon } from './productIcons'

defineProps<{ iconId: string | null }>()
</script>

<template>
  <span class="product-icon" :style="{ maskImage: `url(${JSON.stringify(getProductIcon(iconId))})` }" aria-hidden="true"></span>
</template>

<style scoped>
.product-icon {
  display: block;
  inline-size: 42%;
  aspect-ratio: 1;
  background: currentColor;
  mask: center / contain no-repeat;
}
</style>
