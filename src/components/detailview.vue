<template>
  <div>
    <h1>詳細信息頁面</h1>
    <p>打卡時間: {{ formattedTimestamp }}</p>
    <button @click="goBack">返回地圖</button>
  </div>
</template>

<script>
export default {
  name: 'DetailView',
  data() {
    return {
      timestamp: this.$route.params.timestamp || null,
    };
  },
  computed: {
    formattedTimestamp() {
      return this.timestamp ? new Date(this.timestamp).toLocaleString() : '未提供';
    },
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'Checkin' });
    },
  },
};
</script>

<style>
/* 可根据需要添加样式 */
</style>
