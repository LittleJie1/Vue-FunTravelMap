<template>
  <div>
    <div id="map" ref="map" class="map"></div>
    <button @click="resetMap" class="reset-button">清除标记</button> <!-- 添加清除按钮 -->
  </div>
</template>

<script>
/* global google */
export default {
  name: 'MapView',
  data() {
    return {
      map: null,
      markers: [], // 保存标记的数组
      savedState: {},
      taiwanBounds: {
        north: 28,
        south: 20,
        east: 123,
        west: 117,
      }
    };
  },
  mounted() {
    console.log("Component mounted"); // Debug log
    if (localStorage.getItem('mapState')) {
      this.savedState = JSON.parse(localStorage.getItem('mapState'));
      console.log("Loaded saved state:", this.savedState); // Debug log
    }
    this.loadMapScript();
  },
  methods: {
    loadMapScript() {
      console.log("Loading map script"); // Debug log
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyASHb6WIbfA0TkqvWtDzv5hELC_o2kyPO4&libraries=places`;
      script.defer = true;
      script.onload = () => {
        console.log("Map script loaded"); // Debug log
        this.initMap();
      }; // Ensure initMap is called once script is loaded
      document.head.appendChild(script);
    },
    initMap() {
      console.log("Initializing map"); // Debug log
      this.map = new google.maps.Map(this.$refs.map, {
        center: { lat: 23.6978, lng: 120.9605 },
        zoom: 8, // 设置初始缩放级别
        minZoom: 8, // Set minimum zoom level
        restriction: {
          latLngBounds: this.taiwanBounds,
          strictBounds: false,
        },
        fullscreenControl: false, // Disable fullscreen control
      });

      // 手动设置地图中心
      this.map.setCenter({ lat: 23.6978, lng: 120.9605 });

      // Allow users to click anywhere on the map to place a marker
      this.map.addListener('click', (event) => {
        const position = event.latLng;
        console.log("Map clicked at:", position); // Debug log
        this.addMarker(position);

        // Save state
        const positionKey = `${position.lat()}_${position.lng()}`;
        this.savedState[positionKey] = true;
        console.log("Saving state:", this.savedState); // Debug log
        localStorage.setItem('mapState', JSON.stringify(this.savedState));
      });

      // Show previously saved markers
      for (const key in this.savedState) {
        const [lat, lng] = key.split('_').map(Number);
        console.log("Restoring marker at:", { lat, lng }); // Debug log
        this.addMarker(new google.maps.LatLng(lat, lng));
      }
    },
    addMarker(position) {
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        icon: {
          url: '/flag.png', // 相对于 public 目录的上一层目录
          scaledSize: new google.maps.Size(32, 32), // 调整图标大小
        },
      });

      const infoWindowContent = document.createElement('div');
      infoWindowContent.innerHTML = '這是一個訊息窗口<button id="edit-btn">編輯</button>';

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: true, // 禁用自动平移
      });

      // 添加点击事件，点击时打开信息窗口
      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
        this.$nextTick(() => {
          document.getElementById('edit-btn').addEventListener('click', () => {
            this.editMarker();
          });
        });
      });

      this.markers.push(marker); // 保存标记
    },
    editMarker() {
      this.$router.push({ name: 'DetailView' });
    },
    resetMap() {
      console.log("Resetting map"); // Debug log
      localStorage.removeItem('mapState');
      this.savedState = {};

      // 移除所有标记
      for (let marker of this.markers) {
        marker.setMap(null);
      }
      this.markers = [];
    },
  },
};
</script>

<style>
.map {
  height: 80vh; /* Full viewport height */
  width: 100%;   /* Full viewport width */
}

.reset-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 5;
  background-color: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
