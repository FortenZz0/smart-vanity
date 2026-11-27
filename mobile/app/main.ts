import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { createApp } from 'vue'
import App from './App.vue'
import { listenForIncomingBackups } from './features/backup/backup'
import { syncRitualNotifications } from './features/rituals/ritualNotifications'
import { router } from './router'
import { initializeDatabase } from './storage/database'
import './styles/theme.css'
import './theme'

createApp(App).use(router).mount('#app')

if (Capacitor.getPlatform() === 'android') {
  void router.isReady().then(() => listenForIncomingBackups(() => router.push({ name: 'profile' })))
    .catch((error: unknown) => console.error('Failed to register Android backup opening', error))
  void router.isReady().then(() => CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')
    if (dialog) {
      dialog.close()
    } else if (canGoBack && router.options.history.state.back) {
      router.back()
    } else {
      const { name, meta } = router.currentRoute.value
      if (name === 'home') void CapacitorApp.exitApp()
      else void router.replace({ name: typeof meta.navSection === 'string' ? meta.navSection : 'home' })
    }
  })).catch((error: unknown) => console.error('Failed to register Android back navigation', error))
}

void initializeDatabase().catch((error: unknown) => console.error('Failed to open the local database', error))
syncRitualNotifications(true)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncRitualNotifications()
})
