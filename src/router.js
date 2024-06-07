import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/home.vue';
import Checkin from './components/checkin.vue';
import DetailView from './components/detailview.vue';
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { liffId: '2005515760-nQPja0gB' } // 這是你的第一個 LIFF ID
  },
  {
    path: '/checkin',
    name: 'Checkin',
    component: Checkin,
    meta: { liffId: '2005515760-KDlVv7YG' } // 這是你的第二個 LIFF ID
  },
  {
    path: '/detailview',
    name: 'DetailView',
    component: DetailView,
    meta: { liffId: '2005515760-GWlRoxnZ' } // 這是你的第三個 LIFF ID
  }
];

const router = createRouter({
  history: createWebHistory(), // 使用默認的 WebHistory
  routes
});

export default router;
