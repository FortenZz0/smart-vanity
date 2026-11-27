const storageKey = 'smart-vanity.archive-prompt-seconds'
const maxArchivePromptSeconds = Math.floor(2_147_483_647 / 1000)

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

export const archivePromptSeconds = readDuration()
