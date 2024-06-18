<template>
  <div>
    <div id="map" ref="map" class="map"></div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <button @click="resetMap" class="reset-button">清除标记</button>
    <button @click="addCurrentLocationMarker" class="current-location-button">打卡</button>
  </div>
</template>

<script>
/* global google */
import axios from 'axios';

export default {
  name: 'Checkin',
  data() {
    return {
      map: null,
      markers: [],
      errorMessage: '',
      userProfile: null,
      taiwanBounds: {
        north: 28,
        south: 20,
        east: 123,
        west: 117,
      },
      scriptLoaded: false,
      liffInitialized: false,
    };
  },
  computed: {
    ...mapGetters(['getLiffData']),
  },
  mounted() {
    this.initializeLiff();
  },
  methods: {
    loadMapScript() {
      if (this.scriptLoaded) {
        this.initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyASHb6WIbfA0TkqvWtDzv5hELC_o2kyPO4&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initMap();
      };
      document.head.appendChild(script);
      window.initMap = this.initMap.bind(this);
      this.scriptLoaded = true;
    },
    async initializeLiff() {
      if (!window.liff) return;

      const liffId = "2005515760-KDlVv7YG"; // 确保 LIFF ID 是正确的
      try {
        if (!window.liff.isInit) {
          await window.liff.init({ liffId });
          window.liff.isInit = true;
        }

        if (window.liff.isLoggedIn()) {
          this.getUserProfile();
          this.loadMapScript(); // 只有在用户已登录后才加载地图脚本
        } else {
          window.liff.login({ redirectUri: window.location.href });
        }
      } catch (err) {
        this.errorMessage = 'LIFF Initialization failed: ' + err.message;
      }
    },
    getUserProfile() {
      window.liff.getProfile().then(profile => {
        this.userProfile = profile;
      }).catch(err => {
        this.errorMessage = 'Error getting profile: ' + err.message;
      });
    },
    initMap() {
      if (this.map) {
        return;
      }

      this.map = new google.maps.Map(this.$refs.map, {
        center: pos,
        zoom: 8,
        minZoom: 8,
        restriction: {
          latLngBounds: this.taiwanBounds,
          strictBounds: false,
        },
        fullscreenControl: false,
      });

      this.map.setCenter({ lat: 23.6978, lng: 120.9605 });

      this.fetchMarkers();

      this.map.addListener('click', (event) => {
        const pos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        const timestamp = new Date().toISOString();
        this.addMarker(pos, timestamp);

        if (this.userProfile) {
          axios.post('https://a46c-114-45-71-5.ngrok-free.app/checkin', {
            latitude: pos.lat,
            longitude: pos.lng,
            timestamp: timestamp,
            userProfile: this.userProfile
          })
          .then(() => {
            console.log('Check-in saved successfully');
          })
          .catch(error => {
            this.errorMessage = 'Error saving check-in: ' + error.message;
            console.error('Error saving check-in:', error);
          });
        } else {
          this.errorMessage = 'User profile is not loaded';
        }
      });
    },
    fetchMarkers() {
      axios.post('https://a46c-114-45-71-5.ngrok-free.app/fetch_checkins')
        .then(response => {
          console.log('Response data:', response.data);
          console.log('Data type:', typeof response.data);

          if (Array.isArray(response.data)) {
            response.data.forEach(user => {
              if (user.checkins && Array.isArray(user.checkins)) {
                user.checkins.forEach(checkin => {
                  const position = { lat: checkin.latitude, lng: checkin.longitude };
                  this.addMarker(position, checkin.timestamp);
                });
              }
            });
          } else {
            this.errorMessage = 'Unexpected response data format';
          }
        })
        .catch(error => {
          this.errorMessage = 'Error fetching check-ins: ' + error.message;
          console.error('Error fetching check-ins:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
          } else {
            console.error('Error message:', error.message);
          }
        });
    },
    addMarker(position, timestamp) {
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        icon: {
          url: '/flag.png',
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      const infoWindowContent = document.createElement('div');
      const formattedTimestamp = new Date(timestamp).toLocaleString();
      infoWindowContent.innerHTML = `這是一個訊息窗口<br>打卡時間: ${formattedTimestamp}<br><button id="edit-btn">編輯</button>`;

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: true,
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
        this.$nextTick(() => {
          const editBtn = document.getElementById('edit-btn');
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              this.editMarker(timestamp);
            });
          }
        });
      });

      this.markers.push(marker);
    },
    addCurrentLocationMarker() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          const timestamp = new Date().toISOString();
          this.addMarker(pos, timestamp);

          if (this.userProfile) {
            axios.post('https://a46c-114-45-71-5.ngrok-free.app/checkin', {
              latitude: pos.lat,
              longitude: pos.lng,
              timestamp: timestamp,
              userProfile: this.userProfile
            })
            .then(() => {
              console.log('Check-in saved successfully');
            })
            .catch(error => {
              this.errorMessage = 'Error saving check-in: ' + error.message;
              console.error('Error saving check-in:', error);
            });
          } else {
            this.errorMessage = 'User profile is not loaded';
          }

          this.map.setCenter(pos);
        }, () => {
          this.errorMessage = '無法獲取當前位置';
          alert('無法獲取當前位置');
        });
      } else {
        this.errorMessage = '瀏覽器不支援定位系統';
        alert('瀏覽器不支援定位系統');
      }
    },
    editMarker(timestamp) {
      this.$router.push({ name: 'DetailView', params: { timestamp } });
    },
    resetMap() {
      axios.delete('https://a46c-114-45-71-5.ngrok-free.app/checkins')
        .then(() => {
          console.log('All check-ins deleted successfully');
          this.markers.forEach(marker => {
            marker.setMap(null);
          });
          this.markers = [];
        })
        .catch(error => {
          this.errorMessage = 'Error deleting check-ins: ' + error.message;
          console.error('Error deleting check-ins:', error);
        });
    }
  },
  beforeDestroy() {
    // 清除地图上的所有标记
    if (this.markers.length) {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    }
    // 移除地图引用
    if (this.map) {
      google.maps.event.clearInstanceListeners(this.map);
      this.map = null;
    }
  }
};
</script>

<style>
.map {
  height: 60vh;
  width: 100%;
}

.reset-button, .current-location-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 5;
  background-color: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  margin-left: 10px;
}
.current-location-button {
  left: 120px;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
