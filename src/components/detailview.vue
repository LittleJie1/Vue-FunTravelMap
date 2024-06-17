<template>
  <div>
    <h1>Detail View</h1>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div v-if="checkinDetails">
      <p>紀錄時間: {{ new Date(checkinDetails.timestamp).toLocaleString() }}</p>
    </div>
    <button @click="goBack">返回</button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'DetailView',
  props: ['timestamp', 'checkinId'],  // 接收從路由傳遞過來的 props
  data() {
    return {
      checkinDetails: null,
      errorMessage: '',
    };
  },
  mounted() {
    console.log('Props received:', this.timestamp, this.checkinId);  // 打印接收到的 props
    this.loadCheckinDetails();
  },
  methods: {
    loadCheckinDetails() {
      const checkinId = this.checkinId;
      axios.post(`https://3158-114-45-71-5.ngrok-free.app/checkin/${checkinId}`, {})
        .then(response => {
          this.checkinDetails = response.data;
        })
        .catch(error => {
          this.handleError(error, 'Error fetching check-in details');
        });
    },
    goBack() {
      this.$router.go(-1);
    },
    handleError(error, message) {
      this.errorMessage = message + ': ' + error.message;
      console.error(message, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    }
  }
};
</script>

<style scoped>
.error-message {
  color: red;
}
</style>
