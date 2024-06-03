import { createApp } from 'vue';
import App from './App.vue';
import liff from '@line/liff';
import router from './router';
import store from './store';

// 創建 Vue 應用實例
const app = createApp(App);

// 使用 Vue Router
app.use(router);

// 使用 Vuex Store
app.use(store);

// 將 Vue 應用掛載到 DOM 中的 #app 元素上
app.mount('#app');


// 定義一個初始化 LIFF 的函數
async function initializeLiff(liffId) {
  try {
    await liff.init({ liffId });
    console.log('LIFF initialized with ID:', liffId);

    const profile = await liff.getProfile();
    store.dispatch('updateLiffData', profile);

  } catch (error) {
    console.error('LIFF initialization failed', error);
  }
}
// 在導航守衛中初始化 LIFF
router.beforeEach(async (to, from, next) => {
  const liffId = to.meta.liffId;
  if (liffId) {
    await initializeLiff(liffId);
  }
  next();
});