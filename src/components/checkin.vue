<template>
  <div>
    <div id="map" ref="map" class="map-container"></div>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div class="button-container">
      <div class="itinerary-selector">
        <label for="itinerary">選擇行程:</label>
        <select id="itinerary-selector" v-model="selectedItinerary" @change="updateSelectedItinerary">
          <option value="">選擇行程</option>
          <option v-for="itinerary in itineraries" :key="itinerary.itinerary_id" :value="itinerary.name">{{ itinerary.name }}</option>
        </select>
      </div>
      <button @click="addCurrentLocationMarker" class="add-button">打卡</button>
    </div>
    <div v-if="infoWindowData" class="info-window-content">
      <img v-if="infoWindowData.photo" :src="infoWindowData.photo" alt="Checkin Photo" style="width: 150px; height: 150px; margin-top: 5px; float: left;">
      <div class="text-content">
        <h3>{{ infoWindowData.checkinName }}</h3>
        <p class="date" v-if="infoWindowData.timestamp">時間: {{ infoWindowData.timestamp }}</p>
        <button v-if="infoWindowData.timestamp" @click="editMarker(infoWindowData.timestamp, infoWindowData.checkinId)" class="add-button">編輯</button>
        <button v-if="infoWindowData.timestamp" @click="deleteMarker(infoWindowData.checkinId)" class="add-button">刪除</button>
        <button v-else @click="navigateToPlace(infoWindowData.latitude, infoWindowData.longitude)" class="add-button">導航</button>
      </div>
    </div>

    <!-- 新增：符合條件的景點彈窗 -->
    <div v-if="showPlacesModal" class="places-modal">
      <div class="modal-content">
        <h3>選擇打卡景點</h3>
        <h4>如不選擇，依現在位置打卡</h4>
        <select v-model="selectedPlace">
          <option v-for="place in nearbyPlaces" :key="place.place_id" :value="place">
            {{ place.name }}
          </option>
        </select>
        <button @click="confirmPlace" class="show-button">確定</button>
        <button @click="cancelPlaceSelection" class="show-button">取消</button>
      </div>
    </div>
    <div v-if="showToastFlag" class="toast">{{ toastMessage }}</div>
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
      flags: [],
      errorMessage: '',
      userProfile: null,
      taiwanBounds: {
        north: 28,
        south: 20,
        east: 123,
        west: 117,
      },
      scriptLoaded: false,
      checkinName: '未命名',
      infoWindowData: null,
      itineraries: [],
      selectedItinerary: '',
      showPlacesModal: false,
      nearbyPlaces: [],
      selectedPlace: null,
      currentCheckinData: null,
      toastMessage: '',
      showToastFlag: false

    };
  },
  computed: {
    ...mapGetters(['getLiffData']),
  },
  watch: {
    selectedItinerary() {
      this.reloadMap();
    },
  },
  mounted() {
    this.userProfile = this.getLiffData;
    if (this.userProfile) {
      this.loadMapScript();
      this.fetchItineraries();
    } else {
      this.errorMessage = '獲取LIFF數據失敗';
    }
  },
  methods: {
    showToast(message) {
      this.toastMessage = message;
      this.showToastFlag = true;
      setTimeout(() => {
        this.showToastFlag = false;
      }, 3000); // 顯示3秒後消失
    },
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
              zoom: 9,
              minZoom: 7,
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
    reloadMap() {
      if (this.map) {
        this.clearMarkers();
        this.clearFlags();

        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        this.map = new google.maps.Map(this.$refs.map, {
          center: center,
          zoom: zoom,
          minZoom: 7,
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
        this.createFlags();
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
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/fetch_checkins`, {
        userProfile: this.userProfile
      })
      .then(response => {
        if (Array.isArray(response.data)) {
          response.data.forEach(checkin => {
            const position = { lat: checkin.latitude, lng: checkin.longitude };
            this.addMarker(position, checkin.timestamp, checkin.checkinId, checkin.checkinName, checkin.photos, checkin.palseCheckin);
          });
        } else {
          this.errorMessage = 'Unexpected response data format';
        }
      })
      .catch(error => {
        this.handleError(error, 'Error fetching check-ins');
      });
    },
    fetchItineraries() {
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/get_itineraries`, {
        user_id: this.userProfile.userId
      })
      .then(response => {
        if (response.data.status === 'success') {
          this.itineraries = response.data.itineraries;
        } else {
          this.errorMessage = response.data.message;
        }
      })
      .catch(error => {
        this.handleError(error, 'Error fetching itineraries');
      });
    },
    addMarker(position, timestamp, checkinId, checkinName = '未命名', photos = [], palseCheckin = false) {
      const markerIcon = palseCheckin ? '/flag_true.png' : '/flag_null_no_bg.png';
      const photoUrl = photos.length > 0 ? photos[0] : '/photo.jpg';
      
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        icon: {
          url: markerIcon,
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      marker.addListener('click', () => {
        this.infoWindowData = {
          photo: photoUrl,
          checkinName: checkinName,
          timestamp: new Date(timestamp).toLocaleString(),
          checkinId: checkinId,
          palseCheckin: palseCheckin
        };
      });

      marker.checkinName = checkinName;
      this.markers.push(marker);
    },

    updateSelectedItinerary() {
      const selectedItinerary = this.itineraries.find(itinerary => itinerary.name === this.selectedItinerary);
      if (selectedItinerary) {
        this.selectedItinerary = selectedItinerary.name;
        this.showToast('選擇成功');
      }
    },

    updateCheckinName(event) {
      const selectedPlaceName = event.target.value;
      if (selectedPlaceName !== "依現在位置打卡") {
        this.checkinName = selectedPlaceName;
      } else {
        this.checkinName = '未命名';
      }
    },

    editMarker(timestamp, checkinId) {
      this.$router.push({ name: 'DetailView', query: { timestamp, checkinId } });
    },
    deleteMarker(checkinId) {
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/delete_checkin`, {
        checkinId: checkinId
      })
      .then(response => {
        if (response.data.status === 'success') {
          this.infoWindowData = null; // 清空 infoWindowData
          this.reloadMap();
          this.showToast('刪除成功');
        } else {
          console.error(response.data.message);
        }
      })
      .catch(error => {
        this.handleError(error, 'Error deleting check-in');
      });
    },
    addCurrentLocationMarker() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.handleGeolocationSuccess, this.handleGeolocationError);
      } else {
        this.errorMessage = '瀏覽器不支持定位系統';
        alert('瀏覽器不支持定位系統');
      }
    },
    handleGeolocationSuccess(position) {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      const timestamp = new Date().toISOString();
      if (this.userProfile) {
        this.currentCheckinData = {
          latitude: pos.lat,
          longitude: pos.lng,
          timestamp: timestamp,
          checkinName: this.checkinName,
          userProfile: this.userProfile
        };
        this.checkNearbyPlaces();
      } else {
        this.errorMessage = 'User profile is not loaded';
      }
      this.map.setCenter(pos);
    },
    handleGeolocationError() {
      this.errorMessage = '無法獲取當前位置';
      alert('無法獲取當前位置');
    },
    saveCheckin() {
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/checkin`, this.currentCheckinData)
      .then((response) => {
        const checkinId = response.data.checkinId;
        const palseCheckin = response.data.palseCheckin;
        this.addMarker(
          { lat: this.currentCheckinData.latitude, lng: this.currentCheckinData.longitude },
          this.currentCheckinData.timestamp,
          checkinId,
          this.currentCheckinData.checkinName,
          [],
          palseCheckin
        );
        this.currentCheckinData = null;
        this.showPlacesModal = false;
        this.showToast('打卡成功');
      })
      .catch(error => {
        this.handleError(error, 'Error saving check-in');
      });
    },
    checkNearbyPlaces() {
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/check_nearby_places`, {
        latitude: this.currentCheckinData.latitude,
        longitude: this.currentCheckinData.longitude,
        userProfile: this.userProfile
      })
      .then(response => {
        if (response.data.length > 0) {
          this.nearbyPlaces = response.data;
          this.showPlacesModal = true;
        } else {
          this.saveCheckin();
        }
      })
      .catch(error => {
        this.handleError(error, 'Error checking nearby places');
      });
    },
    confirmPlace() {
      if (this.selectedPlace) {
        this.currentCheckinData.latitude = this.selectedPlace.latitude;
        this.currentCheckinData.longitude = this.selectedPlace.longitude;
        this.currentCheckinData.selectedPlaceId = this.selectedPlace.place_id;
        this.currentCheckinData.checkinName = this.selectedPlace.name; // 更新 checkinName
      }
      this.saveCheckin(); // 保留現有的 checkinName 或更新後的 checkinName
      this.showPlacesModal = false;
    },
    cancelPlaceSelection() {
      this.showPlacesModal = false;
      this.currentCheckinData = null;
    },
    handleError(error, message) {
      this.errorMessage = message + ': ' + error.message;
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    },
    createFlags() {
      const itinerary = this.itineraries.find(itinerary => itinerary.name === this.selectedItinerary);
      if (!itinerary || !itinerary.places) return;

      itinerary.places.forEach(day => {
        day.forEach(place => {
          const flag = new google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: this.map,
            icon: {
              url: '/flag_false_no_bg.png',
              scaledSize: new google.maps.Size(32, 32),
            },
            title: place.name,
          });

          flag.addListener('click', () => {
            this.fetchPlaceDetailsFromGoogle(place.place_id, place.latitude, place.longitude);
          });

          this.flags.push(flag);
        });
      });
    },
    fetchPlaceDetailsFromGoogle(placeId) {
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/proxy_google_places`, {
        place_id: placeId,
        key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      })
      .then(response => {
        if (response.data.status === 'OK') {
          const place = response.data.result;
          const photoUrl = place.photos && place.photos.length > 0 ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}` : null;
          this.infoWindowData = {
            photo: photoUrl,
            checkinName: place.name,
            checkinId: place.place_id
          };
        } else {
          console.error('Error fetching place details from Google:', response.data.status);
        }
      })
      .catch(error => {
        this.handleError(error, 'Error fetching place details from Google');
      });
    },
    navigateToPlace(latitude, longitude) {
      const destination = `${latitude},${longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // 在移動設備上使用 Google Maps URL scheme
        const mapsAppUrl = `comgooglemaps://?daddr=${destination}`;
        window.location.href = mapsAppUrl;
      } else {
        // 在桌面設備上使用網頁版 Google Maps
        window.open(url, '_blank');
      }
    },
    clearMarkers() {
      if (this.markers.length) {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
      }
    },
    clearFlags() {
      if (this.flags.length) {
        this.flags.forEach(flag => flag.setMap(null));
        this.flags = [];
      }
    }
  },
  beforeDestroy() {
    if (this.markers.length) {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    }
    if (this.flags.length) {
      this.flags.forEach(flag => flag.setMap(null));
      this.flags = [];
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
  height: 48vh;
  width: 100%;
}

.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.current-location-button {
  background-color: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  margin-top: 10px;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.info-window-content {
  align-items:center;
  justify-content: center;
  margin-top: 5px; /* 根據需要調整 */
  margin-left: 5px; /* 根據需要調整 */;
  overflow: hidden; /* 確保浮動元素不會影響其他内容布局 */
 
}

.info-window-content img {
  margin-right: 10px;
  margin-top: 25px;
  border: 1px solid #0c0c0c; /* 添加細邊框 */
}

.text-content {
  margin-top: 30px; /* 調整 margin-top 值，使文字向下移動 */
}

.add-button {
  display: inline-block;
  margin-right: 10px;
  margin-top: 5px;
  padding: 10px 20px;
  background-color: #63a5eb;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
}

.itinerary-selector {
  display: flex;
  align-items: center;
}

.itinerary-selector select {
  margin-left: 10px;
  padding: 5px;
  width: 100px; /* 設置固定寬度 */
}

.place-selector {
  display: flex;
  align-items: center;
}

.place-selector select {
  margin-left: 10px;
  padding: 5px;
  width: 150px; /* 設置固定寬度 */
}

.info-window-content .date {
  font-size: 14px; /* 根據需要調整大小 */
}

/* 彈窗樣式 */
.places-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.show-button {
  display: inline-block;
  margin-right: 5px;
  margin-left: 5px;
  margin-top: 5px;
  padding: 5px 10px;
  background-color: #63a5eb;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #009c0a;
  color: rgb(220, 255, 224);
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
}
</style>
