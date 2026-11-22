import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ExplorePage from './pages/ExplorePage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import SettingsPage from './pages/SettingsPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/explore', name: 'explore', component: ExplorePage },
    { path: '/profile', name: 'profile', component: ProfilePage },
    { path: '/profile/settings', name: 'settings', component: SettingsPage },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})
