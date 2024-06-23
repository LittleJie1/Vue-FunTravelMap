import { createApp } from 'vue';
import App from './App.vue';
import liff from '@line/liff';
import router from './router';
import store from './store';

const liffId = '2005485902-yVd49AD9'; // 統一的 LIFF ID

// LIFF 初始化函數
async function initializeLiff() {
  try {
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      const profile = await liff.getProfile();
      store.dispatch('updateLiffData', profile);
    }
    console.log(`LIFF initialized successfully with ID: ${liffId}`);
  } catch (error) {
    console.error('LIFF initialization failed', error);
    // 可以在這裡添加用戶提示或重試邏輯
  }
}

// 等待 LIFF 初始化完成後再掛載 Vue 應用
initializeLiff().then(() => {
  const app = createApp(App);

  app.use(router);
  app.use(store);

  // 使用異步導航守衛來確保 LIFF 已初始化
  router.beforeEach((to, from, next) => {
    console.log(`Navigating to ${to.path}`);
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      next(); // 確保導航不會被阻止
    }
  });

  app.mount('#app');
});
