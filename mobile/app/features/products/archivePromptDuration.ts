import { readonly, ref } from 'vue'

const storageKey = 'smart-vanity.archive-prompt-seconds'
export const maxArchivePromptSeconds = Math.floor(2_147_483_647 / 1000)

function isValidDuration(seconds: number): boolean {
  return Number.isSafeInteger(seconds) && seconds >= 1 && seconds <= maxArchivePromptSeconds
}

function readDuration(): number {
  try {
    const duration = Number(localStorage.getItem(storageKey))
    if (isValidDuration(duration)) return duration
  } catch {
    // Use the default if storage is unavailable.
  }
  return 3
}

const savedDuration = ref(readDuration())
export const archivePromptSeconds = readonly(savedDuration)

export function setArchivePromptSeconds(seconds: number): void {
  if (!isValidDuration(seconds)) return
  savedDuration.value = seconds
  try {
    localStorage.setItem(storageKey, String(seconds))
  } catch {
    // Keep the selected duration for this session.
  }
}
