import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/home.vue';
import Checkin from './components/checkin.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { liffId: '2005485902-yVd49AD9' } // 這是你的第一個 LIFF ID
  },
  {
    path: '/checkin',
    name: 'Checkin',
    component: Checkin,
    meta: { liffId: '2005485902-LB2QaZDa' } // 這是你的第二個 LIFF ID
  }
];

const router = createRouter({
  history: createWebHistory(), // 使用默認的 WebHistory
  routes
});

export default router;
