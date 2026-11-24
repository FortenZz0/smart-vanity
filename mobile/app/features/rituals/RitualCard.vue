<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import skipIcon from '../../../assets/icons/skip_next.svg'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'
import { syncRitualNotifications } from './ritualNotifications'
import { skipRitualReminder } from './ritualRepository'

const props = withDefaults(defineProps<{ ritual: Ritual; now?: Date; interactive?: boolean }>(), {
  now: () => new Date(),
})
const emit = defineEmits<{ skipped: [timestamp: number] }>()
const skipping = ref(false)
const skipFailed = ref(false)

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

async function skipReminder() {
  const next = reminder.value
  if (!next || skipping.value) return

  skipping.value = true
  skipFailed.value = false
  try {
    await skipRitualReminder(props.ritual.id, next.timestamp)
    emit('skipped', next.timestamp)
    syncRitualNotifications()
  } catch (error) {
    console.error('Failed to skip the ritual reminder', error)
    skipFailed.value = true
  } finally {
    skipping.value = false
  }
}
</script>

<template>
  <article class="ritual-card">
    <h2 :title="ritual.name">
      <RouterLink
        v-if="interactive"
        class="ritual-card__link"
        :to="{ name: 'edit-ritual', params: { ritualId: ritual.id } }"
      >
        {{ ritual.name }}
      </RouterLink>
      <template v-else>{{ ritual.name }}</template>
    </h2>
    <span v-if="ritual.archivedAt === null" class="ritual-card__reminder">
      <template v-if="reminder">
        {{ reminder.time }}<template v-if="reminderDate"> · {{ reminderDate }}</template>
      </template>
      <template v-else>{{ translate('ritualNextReminderUnavailable') }}</template>
    </span>
    <button
      v-if="interactive && reminder"
      class="ritual-card__skip"
      type="button"
      :aria-label="translate('skipRitualReminder')"
      :title="translate('skipRitualReminder')"
      :disabled="skipping"
      @click="skipReminder"
    >
      <span :style="{ maskImage: `url(${JSON.stringify(skipIcon)})` }" aria-hidden="true"></span>
    </button>
    <p v-if="skipFailed" class="ritual-card__error" role="alert">{{ translate('ritualSkipError') }}</p>
  </article>
</template>

<style scoped>
.ritual-card {
  position: relative;
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

.ritual-card:has(.ritual-card__skip) {
  grid-template-columns: minmax(0, 1fr) 3.75rem;
}

.ritual-card__link {
  color: inherit;
  text-decoration: none;
}

.ritual-card__link::after {
  position: absolute;
  inset: 0;
  border-radius: 0.875rem;
  content: '';
}

.ritual-card__link:focus-visible::after {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.ritual-card__skip {
  position: relative;
  z-index: 1;
  grid-area: 1 / 2 / span 2;
  display: grid;
  align-self: stretch;
  justify-self: stretch;
  min-block-size: 2.75rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.ritual-card__skip:disabled {
  opacity: 0.55;
  cursor: default;
}

.ritual-card__skip span {
  inline-size: 2.5rem;
  aspect-ratio: 1;
  background: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.ritual-card__error {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--color-expiry-warning-text);
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
