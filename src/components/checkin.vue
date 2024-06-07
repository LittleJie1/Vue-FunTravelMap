<template>
  <div>
    <div id="map" ref="map" class="map"></div>
    <button @click="resetMap" class="reset-button">清除標記</button>
    <button @click="addCurrentLocationMarker" class="current-location-button">打卡</button>
  </div>
</template>

<script>
/* global google, liff */
export default {
  name: 'Checkin',
  data() {
    return {
      map: null,
      markers: [],
      savedState: {},
      taiwanBounds: {
        north: 28,
        south: 20,
        east: 123,
        west: 117,
      },
      isLiff: false, // 添加用於判斷是否為 LIFF 環境的標誌
    };
  },
  mounted() {
    if (localStorage.getItem('mapState')) {
      this.savedState = JSON.parse(localStorage.getItem('mapState'));
    }
    this.loadMapScript();
    this.checkLiffEnvironment();
  },
  methods: {
    loadMapScript() {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyASHb6WIbfA0TkqvWtDzv5hELC_o2kyPO4&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      window.initMap = this.initMap;
    },
    initMap() {
      this.map = new google.maps.Map(this.$refs.map, {
        center: { lat: 23.6978, lng: 120.9605 },
        zoom: 8,
        minZoom: 8,
        restriction: {
          latLngBounds: this.taiwanBounds,
          strictBounds: false,
        },
        fullscreenControl: false,
      });

      this.map.setCenter({ lat: 23.6978, lng: 120.9605 });

      for (const key in this.savedState) {
        const [lat, lng] = key.split('_').map(Number);
        this.addMarker(new google.maps.LatLng(lat, lng), this.savedState[key].timestamp);
      }
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

          const positionKey = `${pos.lat}_${pos.lng}`;
          this.savedState[positionKey] = { timestamp };
          localStorage.setItem('mapState', JSON.stringify(this.savedState));

          this.map.setCenter(pos);
        }, () => {
          alert('無法獲取當前位置');
        });
      } else {
        alert('瀏覽器不支援定位系統');
      }
    },
    editMarker(timestamp) {
      this.$router.push({ name: 'DetailView', params: { timestamp } });
    },
    resetMap() {
      localStorage.removeItem('mapState');
      this.savedState = {};

      for (let marker of this.markers) {
        marker.setMap(null);
      }
      this.markers = [];
    },
    checkLiffEnvironment() {
      if (typeof liff !== 'undefined') {
        liff.init({ liffId: '2005515760-KDlVv7YG' })
          .then(() => {
            this.isLiff = true;
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('from') === 'richmenu') {
              this.addCurrentLocationMarker(); // 只在從 rich menu 進入時打卡
            }
          })
          .catch((err) => {
            console.error('LIFF initialization failed', err);
          });
      }
    }
  },
};
</script>

<style>
.map {
  height: 80vh;
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
</style>
