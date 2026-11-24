import { createApp } from 'vue'
import App from './App.vue'
import { syncRitualNotifications } from './features/rituals/ritualNotifications'
import { router } from './router'
import { initializeDatabase } from './storage/database'
import './styles/theme.css'
import './theme'

createApp(App).use(router).mount('#app')
void initializeDatabase().catch((error: unknown) => console.error('Failed to open the local database', error))
syncRitualNotifications(true)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncRitualNotifications()
})
