<template>
  <div id="home" class="container">
    <h1>Welcome to check App</h1>
    <div v-if="profile">
      <img :src="profile.pictureUrl" alt="Profile Picture" class="profile-img"/>
      <p>Name: {{ profile.displayName }}</p>
      <p>Status: {{ profile.statusMessage }}</p>
    </div>
    <!-- <button @click="getUserProfile">Get Profile</button> -->
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Checkin',
  computed: {
    ...mapGetters(['getLiffData']),
    profile() {
      return this.getLiffData;
    }
  }
};
</script>

<style scoped>
.container {
  text-align: center;
  padding: 20px;
}

.profile-img {
  width: 100px;
  border-radius: 50%;
}
</style>
