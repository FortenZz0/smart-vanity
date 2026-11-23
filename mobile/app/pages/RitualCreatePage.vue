<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getLocalToday } from '../features/products/expiry'
import type { Weekday } from '../features/rituals/ritual'
import { saveRitual } from '../features/rituals/ritualRepository'
import { validateRitualInput, type RitualInput } from '../features/rituals/ritualValidation'
import { locale, translate } from '../locales'

const router = useRouter()
const name = ref('')
const scheduleKind = ref<RitualInput['schedule']['kind']>('daily')
const everyDays = ref('')
const startsOn = ref<string>(getLocalToday())
const selectedWeekdays = ref<Weekday[]>([])
const reminders = ref([{ id: crypto.randomUUID(), time: '09:00' }])
const submitted = ref(false)
const saving = ref(false)
const saveFailed = ref(false)
let ritualId: string | undefined

const weekdays: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'long', timeZone: 'UTC' })
  // 1 января 2024 года — понедельник, как и первый день недели в модели.
  return weekdays.map((day) => ({ day, label: formatter.format(Date.UTC(2024, 0, day)) }))
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

async function submitRitual() {
  if (saving.value) return
  submitted.value = true
  saveFailed.value = false
  const result = validation.value
  if (!result.valid) return

  const submittedFrom = router.currentRoute.value
  saving.value = true
  try {
    ritualId ??= crypto.randomUUID()
    await saveRitual({ id: ritualId, ...result.value })
  } catch (error) {
    console.error('Failed to save the ritual', error)
    saveFailed.value = true
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
    <h1>{{ translate('createRitual') }}</h1>

    <form class="ritual-form" novalidate @submit.prevent="submitRitual">
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
            <label v-for="{ day, label } in weekdayLabels" :key="day">
              <input v-model="selectedWeekdays" name="weekdays" type="checkbox" :value="day">
              {{ label }}
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

        <button class="ritual-form__save" type="submit">{{ translate('saveRitual') }}</button>
        <p v-if="saveFailed" role="alert">{{ translate('ritualSaveError') }}</p>
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

.ritual-form :is(input:not([type='checkbox']), select, button) {
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

.ritual-form__weekdays,
.ritual-form__reminder {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.5rem;
}

.ritual-form__reminder p {
  flex-basis: 100%;
}

.ritual-form .ritual-form__save {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.ritual-form [role='alert'] {
  margin: 0;
  color: var(--color-expiry-warning-text);
}
</style>
