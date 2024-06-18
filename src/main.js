import { createApp } from 'vue';
import App from './App.vue';
import liff from '@line/liff';
import router from './router';
import store from './store';

const app = createApp(App);

app.use(router);
app.use(store);
app.mount('#app');

const liffId = '2005485902-yVd49AD9'; // 統一的 LIFF ID

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
  }
}

initializeLiff();

router.beforeEach((to, from, next) => {
  console.log(`Navigating to ${to.path}`);
  next(); // 確保導航不會被阻止
});
