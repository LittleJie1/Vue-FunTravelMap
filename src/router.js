import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/home.vue';
import About from './components/about.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
];

const router = createRouter({
  history: createWebHistory(), // 使用默認的 WebHistory
  routes
});

export default router;
