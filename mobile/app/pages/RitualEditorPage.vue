<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EditorActions from '../components/EditorActions.vue'
import { getLocalToday } from '../features/products/expiry'
import type { Weekday } from '../features/rituals/ritual'
import { deleteRitual, getRitual, saveRitual } from '../features/rituals/ritualRepository'
import { validateRitualInput, type RitualInput } from '../features/rituals/ritualValidation'
import { locale, translate } from '../locales'

const router = useRouter()
const props = defineProps<{ ritualId?: string }>()
const loadState = ref<'loading' | 'ready' | 'missing' | 'error'>(props.ritualId ? 'loading' : 'ready')
const name = ref('')
const scheduleKind = ref<RitualInput['schedule']['kind']>('daily')
const everyDays = ref('')
const startsOn = ref<string>(getLocalToday())
const selectedWeekdays = ref<Weekday[]>([])
const reminders = ref<RitualInput['reminders'][number][]>([{ id: crypto.randomUUID(), time: '09:00' }])
const submitted = ref(false)
const saving = ref(false)
const actionError = ref<'ritualSaveError' | 'ritualDeleteError' | null>(null)
const archivedAt = ref<string | null>(null)
let ritualId = props.ritualId

const weekdays: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]
const shortWeekdays = {
  ru: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
}
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'long', timeZone: 'UTC' })
  // 1 января 2024 года — понедельник, как и первый день недели в модели.
  return weekdays.map((day) => ({
    day,
    label: formatter.format(Date.UTC(2024, 0, day)),
    shortLabel: shortWeekdays[locale.value][day - 1],
  }))
})

const validation = computed(() => {
  let schedule: RitualInput['schedule'] = { kind: 'daily' }
  if (scheduleKind.value === 'interval') {
    schedule = { kind: 'interval', everyDays: everyDays.value, startsOn: startsOn.value }
  } else if (scheduleKind.value === 'weekly') {
    schedule = { kind: 'weekly', weekdays: selectedWeekdays.value }
  }
  return validateRitualInput({ name: name.value, schedule, reminders: reminders.value })
})
const errors = computed(() => submitted.value && !validation.value.valid ? validation.value.errors : {})

async function loadRitual() {
  if (!props.ritualId) return

  loadState.value = 'loading'
  try {
    const ritual = await getRitual(props.ritualId)
    if (!ritual) {
      loadState.value = 'missing'
      return
    }

    name.value = ritual.name
    archivedAt.value = ritual.archivedAt
    scheduleKind.value = ritual.schedule.kind
    if (ritual.schedule.kind === 'interval') {
      everyDays.value = String(ritual.schedule.everyDays)
      startsOn.value = ritual.schedule.startsOn
    } else if (ritual.schedule.kind === 'weekly') {
      selectedWeekdays.value = [...ritual.schedule.weekdays]
    }
    reminders.value = ritual.reminders.map(({ id, time }) => ({ id, time }))
    loadState.value = 'ready'
  } catch (error) {
    console.error('Failed to load the ritual', error)
    loadState.value = 'error'
  }
}

onMounted(loadRitual)

function addReminder() {
  reminders.value.push({ id: crypto.randomUUID(), time: '' })
}

function goToRituals() {
  const destination = { name: 'rituals' }
  if (router.options.history.state.back === router.resolve(destination).fullPath) {
    router.back()
  } else {
    void router.replace(destination)
  }
}

async function removeRitual() {
  const id = props.ritualId
  if (!id || loadState.value !== 'ready' || saving.value || !window.confirm(translate('confirmDeleteRitual'))) return

  const submittedFrom = router.currentRoute.value
  saving.value = true
  actionError.value = null
  try {
    await deleteRitual(id)
  } catch (error) {
    console.error('Failed to delete the ritual', error)
    actionError.value = 'ritualDeleteError'
    return
  } finally {
    saving.value = false
  }
  if (router.currentRoute.value === submittedFrom) goToRituals()
}

async function submitRitual(event: SubmitEvent) {
  if (saving.value || loadState.value !== 'ready') return
  submitted.value = true
  actionError.value = null
  const result = validation.value
  if (!result.valid) return

  const submittedFrom = router.currentRoute.value
  const action = event.submitter?.getAttribute('value')
  let nextArchivedAt = archivedAt.value
  if (props.ritualId && action === 'archive') nextArchivedAt = new Date().toISOString()
  if (props.ritualId && action === 'restore') nextArchivedAt = null
  saving.value = true
  try {
    ritualId ??= crypto.randomUUID()
    await saveRitual({ id: ritualId, archivedAt: nextArchivedAt, ...result.value })
  } catch (error) {
    console.error('Failed to save the ritual', error)
    actionError.value = 'ritualSaveError'
    return
  } finally {
    saving.value = false
  }
  if (router.currentRoute.value === submittedFrom) goToRituals()
}
</script>

<template>
  <section>
    <button class="ritual-back" type="button" :disabled="saving" @click="goToRituals">
      <span aria-hidden="true">←</span> {{ translate('back') }}
    </button>
    <h1>{{ translate(props.ritualId ? 'editRitual' : 'createRitual') }}</h1>

    <p v-if="loadState === 'loading'" role="status">{{ translate('ritualLoading') }}</p>
    <p v-else-if="loadState === 'missing'" role="status">{{ translate('ritualNotFound') }}</p>
    <div v-else-if="loadState === 'error'">
      <p role="alert">{{ translate('ritualLoadError') }}</p>
      <button type="button" @click="loadRitual">{{ translate('tryAgain') }}</button>
    </div>
    <form v-else class="ritual-form" novalidate @submit.prevent="submitRitual">
      <fieldset class="ritual-form__fields" :disabled="saving">
        <label class="ritual-form__field">
          {{ translate('ritualName') }}
          <input
            v-model="name" name="name" required
            :aria-invalid="!!errors.name" :aria-describedby="errors.name && 'ritual-name-error'"
          >
        </label>
        <p v-if="errors.name" id="ritual-name-error" role="alert">{{ translate('ritualNameRequired') }}</p>

        <label class="ritual-form__field">
          {{ translate('ritualSchedule') }}
          <select v-model="scheduleKind" name="schedule">
            <option value="daily">{{ translate('ritualDaily') }}</option>
            <option value="interval">{{ translate('ritualInterval') }}</option>
            <option value="weekly">{{ translate('ritualWeekly') }}</option>
          </select>
        </label>

        <template v-if="scheduleKind === 'interval'">
          <label class="ritual-form__field">
            {{ translate('ritualIntervalDays') }}
            <input
              v-model="everyDays" name="everyDays" inputmode="numeric" required
              :aria-invalid="!!errors.everyDays" :aria-describedby="errors.everyDays && 'ritual-interval-error'"
            >
          </label>
          <p v-if="errors.everyDays" id="ritual-interval-error" role="alert">{{ translate('ritualIntervalInvalid') }}</p>
          <label class="ritual-form__field">
            {{ translate('ritualStartDate') }}
            <input
              v-model="startsOn" name="startsOn" type="date" required
              :aria-invalid="!!errors.startsOn" :aria-describedby="errors.startsOn && 'ritual-date-error'"
            >
          </label>
          <p v-if="errors.startsOn" id="ritual-date-error" role="alert">{{ translate('ritualDateInvalid') }}</p>
        </template>

        <fieldset v-else-if="scheduleKind === 'weekly'" :aria-describedby="errors.weekdays && 'ritual-weekdays-error'">
          <legend>{{ translate('ritualWeekdays') }}</legend>
          <div class="ritual-form__weekdays">
            <label v-for="{ day, label, shortLabel } in weekdayLabels" :key="day">
              <input v-model="selectedWeekdays" name="weekdays" type="checkbox" :value="day" :aria-label="label">
              <span aria-hidden="true">{{ shortLabel }}</span>
            </label>
          </div>
          <p v-if="errors.weekdays" id="ritual-weekdays-error" role="alert">{{ translate('ritualWeekdaysInvalid') }}</p>
        </fieldset>

        <fieldset class="ritual-form__reminders">
          <legend>{{ translate('ritualReminders') }}</legend>
          <div v-for="(reminder, index) in reminders" :key="reminder.id" class="ritual-form__reminder">
            <label class="ritual-form__field">
              {{ translate('ritualReminderTime') }}
              <input
                v-model="reminder.time" name="reminderTime" type="time" required
                :aria-invalid="!!errors.reminderTimes?.[index]"
                :aria-describedby="errors.reminderTimes?.[index] && 'ritual-time-error-' + reminder.id"
              >
            </label>
            <button v-if="reminders.length > 1" type="button" @click="reminders.splice(index, 1)">
              {{ translate('removeRitualReminder') }}
            </button>
            <p v-if="errors.reminderTimes?.[index]" :id="'ritual-time-error-' + reminder.id" role="alert">
              {{ translate('ritualTimeInvalid') }}
            </p>
          </div>
          <button type="button" @click="addReminder">{{ translate('addRitualReminder') }}</button>
        </fieldset>

        <EditorActions
          :archive-action="props.ritualId ? (archivedAt === null ? 'archive' : 'restore') : undefined"
          :submit-disabled="!name || saving"
          @delete="removeRitual"
        />
        <p v-if="actionError" role="alert">{{ translate(actionError) }}</p>
      </fieldset>
    </form>
  </section>
</template>

<style scoped>
.ritual-back {
  margin-block-end: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: var(--color-accent);
  font: inherit;
}

.ritual-form {
  max-inline-size: 30rem;
  margin-block-start: 1rem;
}

.ritual-form fieldset {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.ritual-form legend {
  margin-block-end: 0.375rem;
  padding: 0;
}

.ritual-form__fields,
.ritual-form__reminders {
  display: grid;
  gap: 1rem;
}

.ritual-form__field {
  display: grid;
  gap: 0.375rem;
}

.ritual-form input:not([type='checkbox']),
.ritual-form select,
.ritual-form__reminders button {
  min-inline-size: 0;
  min-block-size: 2.75rem;
  box-sizing: border-box;
  padding: 0.5rem;
  border: 1px solid var(--color-text-muted);
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.ritual-form__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(0.125rem, 1vw, 0.375rem);
}

.ritual-form__weekdays label {
  position: relative;
  display: grid;
}

.ritual-form__weekdays input {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  opacity: 0;
}

.ritual-form__weekdays input:enabled {
  cursor: pointer;
}

.ritual-form__weekdays span {
  display: grid;
  aspect-ratio: 1;
  min-inline-size: 0;
  place-items: center;
  border: 1px solid var(--color-text-muted);
  border-radius: 50%;
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 600;
}

.ritual-form__weekdays input:checked + span {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.ritual-form__weekdays input:focus-visible + span {
  outline: 2px solid var(--color-accent);
  outline-offset: -4px;
}

.ritual-form__weekdays input:checked:focus-visible + span {
  outline-color: var(--color-on-accent);
}

.ritual-form__reminder {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.5rem;
}

.ritual-form__reminder p {
  flex-basis: 100%;
}

.ritual-form [role='alert'] {
  margin: 0;
  color: var(--color-expiry-warning-text);
}
</style>
