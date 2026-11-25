import { readonly, ref } from 'vue'

const storageKey = 'smart-vanity.expiry-warning-days'
const defaultDays = 30

function isValidThreshold(days: number): boolean {
  return Number.isSafeInteger(days) && days >= 0
}

function readThreshold(): number {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored?.trim() && isValidThreshold(Number(stored))) return Number(stored)
  } catch {
    // Use the default if storage is unavailable.
  }
  return defaultDays
}

const savedDays = ref(readThreshold())
export const expiryWarningDays = readonly(savedDays)

export function setExpiryWarningDays(days: number): void {
  if (!isValidThreshold(days)) return
  savedDays.value = days
  try {
    localStorage.setItem(storageKey, String(days))
  } catch {
    // Keep the selection for this session.
  }
}
