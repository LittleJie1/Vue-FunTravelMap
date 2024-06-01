import { createApp } from 'vue';
import App from './App.vue';
import liff from '@line/liff';
import router from './router';

const liffId = '2005485902-yVd49AD9'; // 替換成你的 LIFF ID

liff.init({ liffId })
  .then(() => {
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      const app = createApp(App);
      app.use(router); // 使用 router
      app.mount('#app');
    }
  })
  .catch((err) => {
    console.error('LIFF initialization failed', err);
  });
