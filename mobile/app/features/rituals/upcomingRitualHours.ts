import { readonly, ref } from 'vue'

const storageKey = 'smart-vanity.upcoming-ritual-hours'
const defaultHours = 24

function readHours(): number {
  try {
    const hours = Number(localStorage.getItem(storageKey))
    if (Number.isSafeInteger(hours) && hours >= 1) return hours
  } catch {
    // Use the default if storage is unavailable.
  }
  return defaultHours
}

const savedHours = ref(readHours())
export const upcomingRitualHours = readonly(savedHours)

export function setUpcomingRitualHours(hours: number): void {
  if (!Number.isSafeInteger(hours) || hours < 1) return
  savedHours.value = hours
  try {
    localStorage.setItem(storageKey, String(hours))
  } catch {
    // The selected value remains available for this session.
  }
}
