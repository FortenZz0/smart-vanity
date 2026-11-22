import { ref, watch } from 'vue'

export const themes = [
  { value: 'light', label: 'themeLight' },
  { value: 'dark', label: 'themeDark' },
  { value: 'system', label: 'themeSystem' },
] as const

type Theme = typeof themes[number]['value']

const defaultTheme: Theme = 'system'
const storageKey = 'smart-vanity.theme'
const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)')

function readSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey)
    return themes.find(({ value }) => value === saved)?.value ?? defaultTheme
  } catch {
    return defaultTheme
  }
}

function applyTheme(value: Theme) {
  const systemTheme = systemColorScheme.matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = value === 'system' ? systemTheme : value
}

export const theme = ref<Theme>(readSavedTheme())
applyTheme(theme.value)

systemColorScheme.addEventListener('change', () => {
  if (theme.value === 'system') applyTheme('system')
})

watch(theme, (value) => {
  applyTheme(value)

  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Тема применяется в текущей сессии, если хранилище недоступно.
  }
})
