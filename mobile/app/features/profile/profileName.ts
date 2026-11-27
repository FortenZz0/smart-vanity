const storageKey = 'smart-vanity.profile-name'

export function normalizeProfileName(value: string): string {
  return /^[\s\p{Default_Ignorable_Code_Point}\p{Cc}]*$/u.test(value) ? '' : value.trim()
}

export function readProfileName(): string {
  try {
    return normalizeProfileName(localStorage.getItem(storageKey) ?? '')
  } catch {
    return ''
  }
}

export function storeProfileName(name: string): void {
  if (name) localStorage.setItem(storageKey, name)
  else localStorage.removeItem(storageKey)
}
