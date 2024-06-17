import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/home.vue';
import Checkin from './components/checkin.vue';
import DetailView from './components/detailview.vue';
import Planner from './components/planner.vue';
// import Journey from './components/journey.vue';

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: Home 
  },
  {
    path: '/checkin', 
    name: 'Checkin', 
    component: Checkin 
  },
  { 
    path: '/detailview', 
    name: 'DetailView', 
    component: DetailView,
    props: route => ({ timestamp: route.query.timestamp, checkinId: route.query.checkinId }) // 確保從 query 獲取參數
  },
  { 
    path: '/planner', 
    name: 'Planner', 
    component: Planner 
  },
  // { path: '/journey', 
  //   name: 'Journey', 
  //   component: Journey 
  // },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
