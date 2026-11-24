<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import pauseIcon from '../../../assets/icons/pause_circle.svg'
import playIcon from '../../../assets/icons/play_circle.svg'
import skipIcon from '../../../assets/icons/skip_next.svg'
import previousIcon from '../../../assets/icons/skip_previous.svg'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'
import { syncRitualNotifications } from './ritualNotifications'
import { getRitual, setRitualPaused, skipRitualReminder, undoRitualSkip } from './ritualRepository'

const props = withDefaults(defineProps<{ ritual: Ritual; now?: Date; interactive?: boolean }>(), {
  now: () => new Date(),
})
const emit = defineEmits<{ updated: [ritual: Ritual] }>()
const pending = ref(false)
const actionFailed = ref(false)

const showActions = computed(() => props.interactive && props.ritual.archivedAt === null)
const canUndo = computed(() => !props.ritual.paused && props.ritual.skippedThrough !== null
  && props.ritual.skippedThrough >= props.now.getTime())
const pauseLabel = computed(() => translate(props.ritual.paused ? 'resumeRitual' : 'pauseRitual'))
const reminder = computed(() => props.ritual.archivedAt === null && !props.ritual.paused
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

async function updateReminder(action: 'previous' | 'pause' | 'next') {
  if (!showActions.value || pending.value) return
  const { id, paused, skippedThrough } = props.ritual
  const next = reminder.value
  if (action === 'previous' && (!canUndo.value || skippedThrough === null)) return
  if (action === 'next' && !next) return

  pending.value = true
  actionFailed.value = false
  try {
    if (action === 'pause') await setRitualPaused(id, !paused)
    else if (action === 'previous' && skippedThrough !== null) await undoRitualSkip(id, skippedThrough)
    else if (action === 'next' && next) await skipRitualReminder(id, next.timestamp)

    syncRitualNotifications(action === 'pause' && paused)
    const updated = await getRitual(id)
    if (updated) emit('updated', updated)
  } catch (error) {
    console.error('Failed to update the ritual reminder', error)
    actionFailed.value = true
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <article class="ritual-card" :class="{ 'ritual-card--with-actions': showActions }">
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
      <template v-if="ritual.paused">{{ translate('ritualPaused') }}</template>
      <template v-else-if="reminder">
        {{ reminder.time }}<template v-if="reminderDate"> · {{ reminderDate }}</template>
      </template>
      <template v-else>{{ translate('ritualNextReminderUnavailable') }}</template>
    </span>
    <div v-if="showActions" class="ritual-card__actions">
      <button
        type="button"
        :aria-label="translate('undoRitualSkip')"
        :title="translate('undoRitualSkip')"
        :disabled="pending || !canUndo"
        @click="updateReminder('previous')"
      >
        <span :style="{ maskImage: `url(${JSON.stringify(previousIcon)})` }" aria-hidden="true"></span>
      </button>
      <button
        class="ritual-card__toggle"
        type="button"
        :aria-label="pauseLabel"
        :title="pauseLabel"
        :disabled="pending"
        @click="updateReminder('pause')"
      >
        <span :style="{ maskImage: `url(${JSON.stringify(ritual.paused ? playIcon : pauseIcon)})` }" aria-hidden="true"></span>
      </button>
      <button
        type="button"
        :aria-label="translate('skipRitualReminder')"
        :title="translate('skipRitualReminder')"
        :disabled="pending || !reminder"
        @click="updateReminder('next')"
      >
        <span :style="{ maskImage: `url(${JSON.stringify(skipIcon)})` }" aria-hidden="true"></span>
      </button>
    </div>
    <p v-if="actionFailed" class="ritual-card__error" role="alert">{{ translate('ritualReminderActionError') }}</p>
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

.ritual-card--with-actions {
  grid-template-columns: minmax(0, 1fr) auto;
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

.ritual-card__actions {
  position: relative;
  z-index: 1;
  grid-area: 1 / 2 / span 2;
  display: grid;
  grid-auto-flow: column;
  align-self: center;
}

.ritual-card__actions button {
  display: grid;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.ritual-card__actions .ritual-card__toggle {
  color: var(--color-accent);
}

.ritual-card__actions button:disabled {
  opacity: 0.55;
  cursor: default;
}

.ritual-card__actions span {
  inline-size: 1.5rem;
  block-size: 1.5rem;
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
  max-inline-size: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.5rem;
  overflow: hidden;
  border-radius: 0.375rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
