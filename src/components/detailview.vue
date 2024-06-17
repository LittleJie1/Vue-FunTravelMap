<template>
  <div>
    <h1>詳細信息頁面</h1>
    <p>打卡時間: {{ formattedTimestamp }}</p>
    <button @click="goBack">返回地圖</button>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'DetailView',
  data() {
    return {
      timestamp: null,
    };
  },
  computed: {
    ...mapGetters(['getLiffData']),
    formattedTimestamp() {
      return this.timestamp ? new Date(this.timestamp).toLocaleString() : '未提供';
    },
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'Checkin' });
    },
    fetchTimestamp() {
      const userId = this.getLiffData.userId; // 从 Vuex 获取 userId
      console.log('userId:', userId); // 添加日志
      if (!userId) {
        console.error('userId is missing');
        return;
      }
      axios.post('https://3158-114-45-71-5.ngrok-free.app/checkin/timestamp', { userId })
        .then(response => {
          console.log('response data:', response.data); // 添加日志
          this.timestamp = response.data.timestamp;
        })
        .catch(error => {
          console.error('Error fetching check-in timestamp:', error);
        });
    },
  },
  created() {
    this.fetchTimestamp();
  },
};
</script>

<style>
/* 可根据需要添加样式 */
</style>
