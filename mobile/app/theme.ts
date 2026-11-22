import { ref, watch } from 'vue'

export const themes = [
  { value: 'light', label: 'themeLight' },
  { value: 'dark', label: 'themeDark' },
] as const

type Theme = typeof themes[number]['value']

const defaultTheme: Theme = 'light'
const storageKey = 'smart-vanity.theme'

function readSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey)
    return themes.find(({ value }) => value === saved)?.value ?? defaultTheme
  } catch {
    return defaultTheme
  }
}

function applyTheme(value: Theme) {
  document.documentElement.dataset.theme = value
}

export const theme = ref<Theme>(readSavedTheme())
applyTheme(theme.value)

watch(theme, (value) => {
  applyTheme(value)

  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Тема применяется в текущей сессии, если хранилище недоступно.
  }
})
