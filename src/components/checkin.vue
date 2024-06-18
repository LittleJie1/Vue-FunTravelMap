<template>
  <div>
    <div id="map" ref="map" class="map-container"></div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <button @click="resetMap" class="reset-button">清除標記</button>
    <button @click="addCurrentLocationMarker" class="current-location-button">打卡</button>
  </div>
</template>

<script>
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { mapGetters } from 'vuex';

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
      checkinName: '未命名', // 預設值
    };
  },
  computed: {
    ...mapGetters(['getLiffData']),
  },
  mounted() {
    this.userProfile = this.getLiffData;
    if (this.userProfile) {
      this.loadMapScript();
    } else {
      this.errorMessage = '獲取LIFF數據失敗';
    }
  },
  methods: {
    loadMapScript() {
      if (this.scriptLoaded) {
        this.initMap();
        return;
      }

      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places'],
      });

      loader.load().then(() => {
        this.initMap();
      }).catch(error => {
        console.error('Error loading Google Maps API:', error);
      });

      this.scriptLoaded = true;
    },
    initMap() {
      if (this.map) {
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.map = new google.maps.Map(this.$refs.map, {
              center: this.userLocation,
              zoom: 8,
              minZoom: 8,
              restriction: {
                latLngBounds: this.taiwanBounds,
                strictBounds: false,
              },
              fullscreenControl: false,
            });
            new google.maps.Marker({
              position: this.userLocation,
              map: this.map,
              title: 'Your Current Location',
            });

            this.fetchMarkers();
            this.map.addListener('click', (event) => {
              const pos = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
              };
              const timestamp = new Date().toISOString();
              this.addMarker(pos, timestamp);

              if (this.userProfile) {
                axios.post('https://537d-114-24-172-69.ngrok-free.app/checkin', {
                  latitude: pos.lat,
                  longitude: pos.lng,
                  timestamp: timestamp,
                  checkinName: this.checkinName, // 添加 checkinName
                  userProfile: this.userProfile
                })
                .then((response) => {
                  const checkinId = response.data.checkinId;
                  this.addMarker(pos, timestamp, checkinId); // 使用返回的 checkinId
                  console.log('Check-in saved successfully');
                })
                .catch(error => {
                  this.handleError(error, 'Error saving check-in');
                });
              } else {
                this.errorMessage = 'User profile is not loaded';
              }
            });
          },
          (error) => {
            console.error('Error getting user location:', error);
            this.handleLocationError(true, { lat: 23.6978, lng: 120.9605 });
          }
        );
      } else {
        this.handleLocationError(false, { lat: 23.6978, lng: 120.9605 });
      }
    },
    handleLocationError(browserHasGeolocation, pos) {
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
      new google.maps.InfoWindow({
        position: pos,
        content: browserHasGeolocation
          ? 'Error: The Geolocation service failed.'
          : "Error: Your browser doesn't support geolocation.",
      }).open(this.map);
    },
    fetchMarkers() {
      axios.post('https://537d-114-24-172-69.ngrok-free.app/fetch_checkins')
        .then(response => {
          console.log('Response data:', response.data);
          if (Array.isArray(response.data)) {
            response.data.forEach(user => {
              if (user.checkins && Array.isArray(user.checkins)) {
                user.checkins.forEach(checkin => {
                  const position = { lat: checkin.latitude, lng: checkin.longitude };
                  this.addMarker(position, checkin.timestamp, checkin.checkinId); // 傳遞 checkinId
                });
              }
            });
          } else {
            this.errorMessage = 'Unexpected response data format';
          }
        })
        .catch(error => {
          this.handleError(error, 'Error fetching check-ins');
        });
    },
    addMarker(position, timestamp, checkinId) {
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
      infoWindowContent.innerHTML = `${this.checkinName}<br>時間: ${formattedTimestamp}<br><button class="edit-btn">編輯</button>`;

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: true,
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
        this.$nextTick(() => {
          const editBtn = infoWindowContent.querySelector('.edit-btn');
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              console.log('Edit button clicked, checkinId:', checkinId);  // 添加日志檢查 checkinId
              this.editMarker(timestamp, checkinId);
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
            axios.post('https://537d-114-24-172-69.ngrok-free.app/checkin', {
              latitude: pos.lat,
              longitude: pos.lng,
              timestamp: timestamp,
              checkinName: this.checkinName, // 添加 checkinName
              userProfile: this.userProfile
            })
            .then(() => {
              console.log('Check-in saved successfully');
            })
            .catch(error => {
              this.handleError(error, 'Error saving check-in');
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
    editMarker(timestamp, checkinId) {
      console.log('Editing check-in:', checkinId);  // 添加日志檢查 checkinId
      this.$router.push({ name: 'DetailView', query: { timestamp, checkinId } }); // 使用 query 傳遞參數
    },
    resetMap() {
      axios.delete('https://537d-114-24-172-69.ngrok-free.app/checkins')
        .then(() => {
          console.log('All check-ins deleted successfully');
          this.markers.forEach(marker => {
            marker.setMap(null);
          });
          this.markers = [];
        })
        .catch(error => {
          this.handleError(error, 'Error deleting check-ins');
        });
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
  },
  beforeDestroy() {
    if (this.markers.length) {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    }
    if (this.map) {
      google.maps.event.clearInstanceListeners(this.map);
      this.map = null;
    }
  }
};
</script>

<style scoped>
.map-container {
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
