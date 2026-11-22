import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ProductEditorPage from './pages/ProductEditorPage.vue'
import ExplorePage from './pages/ExplorePage.vue'
import ProfilePage from './pages/ProfilePage.vue'
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
    { path: '/explore', name: 'explore', component: ExplorePage },
    { path: '/profile', name: 'profile', component: ProfilePage },
    {
      path: '/profile/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { navSection: 'profile' },
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})
