import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/home.vue';
import Checkin from './components/checkin.vue';
import DetailView from './components/detailview.vue';
import Planner from './components/planner.vue';

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
  },
  {
    path: '/detailview',
    name: 'DetailView',
    component: DetailView,
    meta: { liffId: '2005485902-B8Oqly4l' } // 這是你的第三個 LIFF ID
  },
  {
    path: '/planner',
    name: 'Planner',
    component: Planner,
    meta: { liffId: '2005485902-4AJG81l8' } // 這是你的第四個 LIFF ID
  },
];

const router = createRouter({
  history: createWebHistory(), // 使用默認的 WebHistory
  routes
});

export default router;
