<template>
  <div id="home" class="container">
    <h1>Welcome to LIFF App</h1>
    <div v-if="profile">
      <img :src="profile.pictureUrl" alt="Profile Picture" class="profile-img"/>
      <p>Name: {{ profile.displayName }}</p>
      <p>Status: {{ profile.statusMessage }}</p>
    </div>
    <button @click="getUserProfile">Get Profile</button>
  </div>
</template>

<script>
import liff from '@line/liff'

export default {
  data() {
    return {
      profile: null
    }
  },
  created() {
    console.log('Home component created')
  },
  methods: {
    async getUserProfile() {
      try {
        const profile = await liff.getProfile();
        console.log('Profile fetched:', profile)
        this.profile = profile;
      } catch (error) {
        console.error('Error getting profile:', error);
      }
    }
  }
}
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
