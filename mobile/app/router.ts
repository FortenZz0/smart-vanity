import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ProductEditorPage from './pages/ProductEditorPage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import RitualEditorPage from './pages/RitualEditorPage.vue'
import RitualsPage from './pages/RitualsPage.vue'
import SettingsPage from './pages/SettingsPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/products/new',
      name: 'create-product',
      component: ProductEditorPage,
      meta: { navSection: 'home' },
    },
    {
      path: '/products/:productId/edit',
      name: 'edit-product',
      component: ProductEditorPage,
      props: true,
      meta: { navSection: 'home' },
    },
    { path: '/explore', redirect: { name: 'rituals' } },
    { path: '/profile', name: 'profile', component: ProfilePage },
    {
      path: '/rituals',
      name: 'rituals',
      component: RitualsPage,
      alias: '/profile/rituals',
    },
    {
      path: '/rituals/new',
      name: 'create-ritual',
      component: RitualEditorPage,
      alias: '/profile/rituals/new',
      meta: { navSection: 'rituals' },
    },
    {
      path: '/rituals/:ritualId/edit',
      name: 'edit-ritual',
      component: RitualEditorPage,
      props: true,
      alias: '/profile/rituals/:ritualId/edit',
      meta: { navSection: 'rituals' },
    },
    {
      path: '/profile/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { navSection: 'profile' },
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})
