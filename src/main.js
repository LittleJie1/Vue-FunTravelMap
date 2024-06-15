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
let initializedLiffId = null; // 用來記錄已初始化的 LIFF ID

async function initializeLiff(liffId) {
  if (liffId === initializedLiffId) {
    return; // 如果 LIFF ID 沒有變化，則不重新初始化
  }
  try {
    await liff.init({ liffId });
    // console.log('LIFF initialized with ID:', liffId);

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    } else {
      const profile = await liff.getProfile();
      store.dispatch('updateLiffData', profile);
    }

    initializedLiffId = liffId; // 記錄已初始化的 LIFF ID

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