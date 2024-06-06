<template>
  <div>
    <h1>詳細信息頁面</h1>
    <button @click="goBack">返回地圖</button>
  </div>
</template>

<script>
export default {
  name: 'DetailView',
  methods: {
    goBack() {
      this.$router.push({ name: 'Checkin' });
    },
    resetMap() {
      localStorage.removeItem('mapState');
      this.$router.push({ name: 'Checkin' }).then(() => {
        window.location.reload();
      });
    }
  }
};
</script>

<style>
/* 可根据需要添加样式 */
</style>
