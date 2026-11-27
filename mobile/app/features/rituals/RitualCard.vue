<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { RouterLink } from 'vue-router'
import moreIcon from '../../../assets/icons/more_vert.svg'
import restoreIcon from '../../../assets/icons/unarchive.svg'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'
import { syncRitualNotifications } from './ritualNotifications'
import { getRitual, restoreRitual, setRitualPaused, skipRitualReminder, undoRitualSkip } from './ritualRepository'

const props = withDefaults(defineProps<{ ritual: Ritual; now?: Date; interactive?: boolean }>(), {
  now: () => new Date(),
})
const emit = defineEmits<{ updated: [ritual: Ritual] }>()
const pending = ref(false)
const actionsOpen = ref(false)
const actionsAbove = ref(false)
const actions = ref<HTMLElement | null>(null)
const actionsButton = ref<HTMLButtonElement | null>(null)
const actionsId = useId()
const actionError = ref<'ritualReminderActionError' | 'ritualRestoreError' | null>(null)

const archived = computed(() => props.ritual.archivedAt !== null)
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

watch(actionsOpen, (open, _, onCleanup) => {
  if (!open) return
  function dismiss(event: PointerEvent) {
    if (!actions.value?.contains(event.target as Node)) actionsOpen.value = false
  }
  document.addEventListener('pointerdown', dismiss)
  onCleanup(() => document.removeEventListener('pointerdown', dismiss))
})

function closeActions() {
  actionsOpen.value = false
  actionsButton.value?.focus()
}

function toggleActions() {
  if (pending.value) return
  if (!actionsOpen.value && actionsButton.value) {
    const { top, bottom } = actionsButton.value.getBoundingClientRect()
    actionsAbove.value = window.innerHeight - bottom < 200 && top > window.innerHeight - bottom
  }
  actionsOpen.value = !actionsOpen.value
}

async function updateRitual(action: 'previous' | 'pause' | 'next' | 'restore') {
  if (!props.interactive || pending.value || archived.value !== (action === 'restore')) return
  const { id, paused, skippedThrough } = props.ritual
  const next = reminder.value
  if (action === 'previous' && (!canUndo.value || skippedThrough === null)) return
  if (action === 'next' && !next) return

  if (actionsOpen.value) closeActions()
  pending.value = true
  actionError.value = null
  try {
    if (action === 'restore') await restoreRitual(id)
    else if (action === 'pause') await setRitualPaused(id, !paused)
    else if (action === 'previous' && skippedThrough !== null) await undoRitualSkip(id, skippedThrough)
    else if (action === 'next' && next) await skipRitualReminder(id, next.timestamp)

    syncRitualNotifications((action === 'restore' && !paused) || (action === 'pause' && paused))
    const updated = await getRitual(id)
    if (updated) emit('updated', updated)
  } catch (error) {
    console.error('Failed to update the ritual', error)
    actionError.value = action === 'restore' ? 'ritualRestoreError' : 'ritualReminderActionError'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <article class="ritual-card" :class="{ 'ritual-card--with-actions': interactive }">
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
    <div v-if="interactive && archived" class="ritual-card__actions ritual-card__actions--archived">
      <button
        type="button"
        :aria-label="translate('restoreFromArchive')"
        :title="translate('restoreFromArchive')"
        :disabled="pending"
        @click="updateRitual('restore')"
      >
        <span :style="{ maskImage: `url(${JSON.stringify(restoreIcon)})` }" aria-hidden="true"></span>
      </button>
    </div>
    <div
      v-else-if="interactive"
      ref="actions"
      class="ritual-card__actions"
      :class="{ 'ritual-card__actions--open': actionsOpen, 'ritual-card__actions--above': actionsAbove }"
      @keydown.esc.stop="actionsOpen && closeActions()"
      @focusout="!actions?.contains($event.relatedTarget as Node) && (actionsOpen = false)"
    >
      <button
        ref="actionsButton"
        type="button"
        :aria-label="translate('ritualActions')"
        :aria-expanded="actionsOpen"
        :aria-controls="actionsId"
        :aria-disabled="pending"
        @click="toggleActions"
      >
        <span :style="{ maskImage: `url(${JSON.stringify(moreIcon)})` }" aria-hidden="true"></span>
      </button>
      <div v-show="actionsOpen" :id="actionsId" class="ritual-card__menu">
        <button type="button" :disabled="pending || !canUndo" @click="updateRitual('previous')">
          {{ translate('undoRitualSkip') }}
        </button>
        <button type="button" :disabled="pending" @click="updateRitual('pause')">{{ pauseLabel }}</button>
        <button type="button" :disabled="pending || !reminder" @click="updateRitual('next')">
          {{ translate('skipRitualReminder') }}
        </button>
      </div>
    </div>
    <p v-if="actionError" class="ritual-card__error" role="alert">{{ translate(actionError) }}</p>
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
  padding: 0.75rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
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
  border-radius: var(--radius-card);
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
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
}

.ritual-card__actions button {
  display: grid;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.ritual-card__actions--archived {
  grid-row: 1;
}

.ritual-card__actions--open {
  z-index: 2;
}

.ritual-card__actions button:is(:disabled, [aria-disabled='true']) {
  opacity: 0.55;
  cursor: default;
}

.ritual-card__menu {
  position: absolute;
  inset-block-start: calc(100% + 0.25rem);
  inset-inline-end: 0;
  inline-size: max-content;
  max-inline-size: min(15rem, calc(100vw - 3.5rem));
  padding: 0.25rem;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.ritual-card__menu button {
  inline-size: 100%;
  block-size: auto;
  min-block-size: 2.75rem;
  padding: 0.5rem 0.75rem;
  place-items: center start;
  color: var(--color-text);
  text-align: start;
}

.ritual-card__actions--above .ritual-card__menu {
  inset-block: auto calc(100% + 0.25rem);
}

.ritual-card__menu button:enabled:is(:hover, :focus-visible) {
  background: var(--color-surface-soft);
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
  margin: 0;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.ritual-card__reminder {
  max-inline-size: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-control);
  background: var(--color-surface-soft);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  overflow-wrap: anywhere;
}
</style>
