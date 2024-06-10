<template>
  <div id="app">
    <div class="navbar">
      <router-link to="/">Home</router-link>
      <router-link to="/checkin">Checkin</router-link>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
#app {
  text-align: center;
  background-color: #ffffff;
  margin-top: 45px;
}

.navbar {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #f8f8f8;
  text-align: center;
  padding: 20px 0;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
}

.navbar a {
  position: relative;
  margin: 0 15px;
  color: #000;
  text-decoration: none;
  transition: color 0.3s ease;
}

.navbar a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -5px;
  width: 100%;
  height: 2px;
  background-color: #007BFF;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.navbar a:hover {
  color: #007BFF;
}

.navbar a:hover::after {
  transform: scaleX(1);
}

</style>
