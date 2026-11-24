<script setup lang="ts">
import { computed } from 'vue'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'

const props = withDefaults(defineProps<{ ritual: Ritual; now?: Date }>(), {
  now: () => new Date(),
})

const reminder = computed(() => props.ritual.archivedAt === null
  ? getNextRitualReminder(props.ritual, props.now)
  : null)
const reminderDate = computed(() => {
  const next = reminder.value
  if (!next || next.daysUntil === 0) return ''
  if (next.daysUntil === 1) return translate('ritualTomorrow')

  const day = String(next.date.getUTCDate()).padStart(2, '0')
  const month = String(next.date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
})
</script>

<template>
  <article class="ritual-card">
    <h2 :title="ritual.name">{{ ritual.name }}</h2>
    <span v-if="ritual.archivedAt === null" class="ritual-card__reminder">
      <template v-if="reminder">
        {{ reminder.time }}<template v-if="reminderDate"> · {{ reminderDate }}</template>
      </template>
      <template v-else>{{ translate('ritualNextReminderUnavailable') }}</template>
    </span>
  </article>
</template>

<style scoped>
.ritual-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-block-size: 4rem;
  align-content: center;
  justify-items: start;
  gap: 0.375rem;
  padding: 0.625rem;
  border: 1px solid var(--color-divider);
  border-radius: 0.875rem;
  background: var(--color-surface);
}

.ritual-card h2 {
  max-inline-size: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ritual-card__reminder {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
