import { ref, watch } from 'vue'
import en from './en.json'
import ru from './ru.json'

export const languages = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const

type Locale = typeof languages[number]['code']
type MessageKey = keyof typeof ru

const defaultLocale: Locale = 'ru'
const storageKey = 'smart-vanity.locale'
// проверка, что все ключи в локалях совпадают
const messages = { ru, en } satisfies Record<Locale, Record<MessageKey, string>>

function readSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(storageKey)
    return languages.find(({ code }) => code === saved)?.code ?? defaultLocale
  } catch {
    return defaultLocale
  }
}

export const locale = ref<Locale>(readSavedLocale())

export function translate(key: MessageKey): string {
  return messages[locale.value][key]
}

watch(locale, (value) => {
  document.documentElement.lang = value

  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Язык продолжит действовать в текущей сессии, если хранилище недоступно.
  }
}, { immediate: true })
