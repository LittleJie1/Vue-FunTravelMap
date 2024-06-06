<template>
  <div>
    <div ref="mapContainer" style="width: 100%; height: 50vh;"></div>
    <button @click="showNearbyPlaces('tourist_attraction')">顯示附近景點</button>
    <button @click="showNearbyPlaces('restaurant')">顯示附近餐廳</button>
  </div>
</template>

<script>
import { Loader } from '@googlemaps/js-api-loader';

export default {
  name: 'Home',
  data() {
    return {
      map: null,
      userLocation: null,
      placesService: null,
      markers: [], // 用於存儲標記
      infoWindows: [], // 用於存儲信息窗口
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    async initMap() {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,  // 使用環境變量
        version: 'weekly',
        libraries: ['places'],  // 確保加載 Places 庫
      });

      try {
        await loader.importLibrary("maps");

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              this.map = new google.maps.Map(this.$refs.mapContainer, {
                center: this.userLocation,
                zoom: 15,
              });
              new google.maps.Marker({
                position: this.userLocation,
                map: this.map,
                title: 'Your Current Location',
              });

              // 初始化 PlacesService
              this.placesService = new google.maps.places.PlacesService(this.map);
            },
            (error) => {
              console.error('Error getting user location:', error);
              this.handleLocationError(true, { lat: 25.0330, lng: 121.5654 });
            }
          );
        } else {
          // 瀏覽器不支持地理位置
          this.handleLocationError(false, { lat: 25.0330, lng: 121.5654 });
        }
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      }
    },
    handleLocationError(browserHasGeolocation, pos) {
      this.map = new google.maps.Map(this.$refs.mapContainer, {
        center: pos,
        zoom: 15,
      });
      new google.maps.InfoWindow({
        position: pos,
        content: browserHasGeolocation
          ? 'Error: The Geolocation service failed.'
          : "Error: Your browser doesn't support geolocation.",
      }).open(this.map);

      // 初始化 PlacesService
      this.placesService = new google.maps.places.PlacesService(this.map);
    },
    showNearbyPlaces(type) {
      if (!this.placesService || !this.map.getCenter()) {
        console.error('PlacesService or map center not initialized');
        return;
      }

      // 清除舊的標記和信息窗口
      this.clearMarkers();

      const center = this.map.getCenter();
      const request = {
        location: center,
        radius: '500',
        type: [type],
      };

      this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          results.forEach((place) => {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: place.name,
            });

            // 添加點擊事件來顯示景點名稱
            const infoWindow = new google.maps.InfoWindow({
              content: place.name,
            });

            marker.addListener('click', () => {
              infoWindow.open(this.map, marker);
            });

            this.markers.push(marker); // 保存標記以便於清除
            this.infoWindows.push(infoWindow); // 保存信息窗口以便於清除
          });
        } else {
          console.error('Error fetching nearby places:', status);
        }
      });
    },
    clearMarkers() {
      // 移除所有標記
      this.markers.forEach((marker) => {
        marker.setMap(null);
      });
      // 清空標記數組
      this.markers = [];

      // 關閉所有信息窗口
      this.infoWindows.forEach((infoWindow) => {
        infoWindow.close();
      });
      // 清空信息窗口數組
      this.infoWindows = [];

      // 強制重繪地圖
      this.map = new google.maps.Map(this.$refs.mapContainer, {
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
      });
    },
  },
};
</script>

<style scoped>
/* 根據需要調整地圖容器的樣式 */
</style>
