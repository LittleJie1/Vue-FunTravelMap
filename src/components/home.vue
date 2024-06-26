<template>
  <div>
    <div class="search-container">
      <input id="autocomplete-input" class="controls" type="text" v-model="searchQuery" placeholder="搜尋地點" />
      <button class="clear-button" @click="clearSearch">✖</button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
    <div class="buttons">
      <button @click="showNearbyPlaces('tourist_attraction')">景點</button>
      <button @click="showNearbyPlaces('restaurant')">餐廳</button>
      <button @click="showNearbyPlaces('lodging')">住宿</button>
      <button @click="showNearbyPlaces('transit_station')">公車站</button>
      <button @click="showNearbyPlaces('bus_station')">捷運站</button>
    </div>
    <div v-if="selectedPlace" class="info-container">
      <button class="close-button" @click="clearSelectedPlace">✖</button>
      <div class="info-content">
        <div class="info-image" v-if="selectedPlace.photos && selectedPlace.photos.length">
          <img :src="selectedPlace.photos[0].getUrl()" alt="Place Image">
        </div>
        <div class="info-details">
          <h3>{{ selectedPlace.name }}</h3>
          <p>★ {{ selectedPlace.rating ? selectedPlace.rating : '無評價' }}</p>
          <button v-if="selectedItinerary" class="add-button" @click="addToItinerary">+ 行程</button>
        </div>
      </div>
    </div>
    <div v-else class="info-placeholder">
      歡迎使用趣旅圖!<br>
      請先至
      <span style="font-weight: bold; color: #AE0000;">行程總覽</span>
      建立行程<br>
      點選<span style="font-weight: bold; color: #025ec0;">行程安排</span>點擊上方的天數<br>
      返回此頁面搜尋景點並加入行程!
    </div>
    <div v-if="showToast" class="toast">加入成功！</div>
  </div>
</template>

<script>
import { Loader } from '@googlemaps/js-api-loader';
import iconData from '../assets/icon.json';
import { mapGetters } from 'vuex';
import axios from 'axios';

export default {
  name: 'Home',
  data() {
    return {
      map: null,
      userLocation: null,
      placesService: null,
      markers: [], // 用於存儲標記
      infoWindows: [], // 用於存儲信息窗口
      base64Icon: iconData.base64Icon,
      searchQuery: '', // 用於存儲搜索查詢
      autocomplete: null, // 用於存儲自動完成控件
      selectedPlace: null,
      showToast: null,
      profile: null
    };
  },
  computed: {
    ...mapGetters(['getLiffData', 'selectedItinerary', 'selectedDayIndex']),
  },
  async mounted() {
    if (this.getLiffData) {
      this.profile = this.getLiffData;
    }
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
        await loader.load();
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
                mapTypeId: 'roadmap',
              });
              new google.maps.Marker({
                position: this.userLocation,
                map: this.map,
                title: 'Your Current Location',
              });

              // 初始化 PlacesService
              this.placesService = new google.maps.places.PlacesService(this.map);

              // 初始化自動完成控件
              const input = document.getElementById('autocomplete-input');
              this.autocomplete = new google.maps.places.Autocomplete(input);
              this.autocomplete.bindTo('bounds', this.map);

              // 監聽自動完成的地點變更事件
              this.autocomplete.addListener('place_changed', this.handlePlaceChanged);
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
    handlePlaceChanged() {  //搜尋視窗部分
      const place = this.autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.error("No details available for input: '" + place.name + "'");
        return;
      }

      // 清除舊的標記
      this.clearMarkers();

      function getTextWidth(text, font) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = font;
        return context.measureText(text).width;
      }

      const text = `${place.name}`;
      const rating = place.rating ? `★ ${place.rating}` : '無評價';
      const font = '12px Arial, Helvetica, sans-serif';

      const textWidth = getTextWidth(text, font);
      const ratingWidth = getTextWidth(rating, font);
      const svgWidth = Math.max(textWidth, ratingWidth) + 30; // 確保 SVG 寬度足以容納文本和內邊距
      const svgHeight = 80; // 增加高度以容納點和文字

      const iconSvg = `
              <svg xmlns='http://www.w3.org/2000/svg' width='${svgWidth}' height='${svgHeight}'>
              <rect x='0' y='0' width='${svgWidth}' height='35' rx='8' ry='8' fill='#5599FF' stroke='#007bff' stroke-width='1'/>
              <text x='${svgWidth / 2}' y='15' font-size='12' fill='#3C3C3C' font-family='Arial, Helvetica, sans-serif' font-weight='bold' text-anchor='middle'>
                ${place.name}
              </text>
              <text x='${svgWidth / 2}' y='30' font-size='12' fill='#FFD700' font-family='Arial, Helvetica, sans-serif'  text-anchor='middle'>
                ★ ${rating}
              </text>
              <image x='${svgWidth / 2 - 12.5}' y='40' width='25' height='25' href='${this.base64Icon}' />
              </svg>`;

      const encodedIconSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`;

      const icon = {
        url: encodedIconSvg,
        scaledSize: new google.maps.Size(svgWidth, svgHeight),
        anchor: new google.maps.Point(svgWidth / 2, svgHeight) // 將錨點設置在點的中心下方
      };

      const marker = new google.maps.Marker({
        map: this.map,
        position: place.geometry.location,
        icon: icon,
      });

      this.markers.push(marker);
      this.selectedPlace = place;

      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(15);
      }

    },
    showNearbyPlaces(type) { // 顯示景點、餐廳、住宿 車站 方法
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
            const rating = place.rating ? place.rating : '無評價';
            const text = `${place.name} - ${rating}`;

            // 計算文本寬度，設置適當的SVG寬度
            const textWidth = text.length * 8;
            const svgWidth = textWidth + 30; // 增加內邊距和標記空間
            const svgHeight = 80; // 增加高度以容納點和文字

            // 使用SVG來生成自定義標記
            const iconSvg = `
            <svg xmlns='http://www.w3.org/2000/svg' width='${svgWidth}' height='${svgHeight}'>
              <rect x='0' y='0' width='${svgWidth}' height='35' rx='8' ry='8' fill='#5599FF' stroke='#007bff' stroke-width='1'/>
              <text x='${svgWidth / 2}' y='15' font-size='12' fill='#3C3C3C' font-family='Arial, Helvetica, sans-serif' font-weight='bold' text-anchor='middle'>
                ${place.name}
              </text>
              <text x='${svgWidth / 2}' y='30' font-size='12' fill='#FFD700' font-family='Arial, Helvetica, sans-serif'  text-anchor='middle'>
                ★ ${rating}
              </text>
              <image x='${svgWidth / 2 - 12.5}' y='40' width='25' height='25' href='${this.base64Icon}' />
            </svg>`;

            const encodedIconSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`;

            const icon = {
              url: encodedIconSvg,
              scaledSize: new google.maps.Size(svgWidth, svgHeight),
              anchor: new google.maps.Point(svgWidth / 2, svgHeight) // 將錨點設置在點的中心下方
            };

            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: text,
              icon: icon,
            });
            marker.addListener('click', () => {
              this.selectedPlace = place; // 新增，點擊標記時將選定的地點信息存儲到 selectedPlace 中
            });

            this.markers.push(marker); // 保存標記以便於清除
          });
        } else {
          console.error('Error fetching nearby places:', status);
        }
      });
    },
    clearMarkers() {  //清除標記跟重繪地圖
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
    clearSearch() { // 搜尋視窗 清除按鈕x
      this.searchQuery = '';
      this.selectedPlace = null; // 新增，清空搜索時清空選定的地點信息
    },
    clearSelectedPlace() { // 新增的方法，清除選中的地點信息
      this.selectedPlace = null;
    },
    async addToItinerary() {
      if (this.selectedPlace && this.selectedPlace.geometry && this.selectedPlace.geometry.location) {
        const address = this.selectedPlace.formatted_address || this.selectedPlace.vicinity || '';

        const place = {
          place_id: this.selectedPlace.place_id,
          name: this.selectedPlace.name,
          latitude: this.selectedPlace.geometry.location.lat(),
          longitude: this.selectedPlace.geometry.location.lng(),
          address: address,
          visited: false,
        };

        const itineraryId = this.selectedItinerary.itinerary_id;
        const dayIndex = this.selectedDayIndex;

        try {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/add_place`, {
            itinerary_id: itineraryId,
            day_index: dayIndex,
            place: place,
          });

          if (response.data.status === 'success') {
            this.showToast = true;
            setTimeout(() => {
              this.showToast = false;
            }, 1000);
          } else {
            console.error('後端錯誤:', response.data.message || '未知錯誤');
          }
        } catch (error) {
          console.error('網絡錯誤:', error.message);
        }
      }
    },
  }
};
</script>

<style scoped>
.search-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 300px;
  z-index: 5;
  display: flex;
  align-items: center;
}

.controls {
  background-color: #fff;
  border-radius: 2px;
  border: 1px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  font-family: Roboto;
  font-size: 15px;
  font-weight: 300;
  height: 29px;
  outline: none;
  padding: 0 11px 0 13px;
  text-overflow: ellipsis;
  width: 100%;
}

.clear-button {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  margin-left: -40px;
  z-index: 6;
}

.map-container {
  position: relative;
  width: 100%;
  height: 45vh;
  margin-top: 10px;
}

.info-container {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 300px;
  height: 135px;
  /* 固定高度 */
  background: hsl(201, 95%, 92%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  /* 隱藏超出內容 */
}

.info-content {
  display: flex;
  align-items: center;
  width: 100%;
  /* 確保內容寬度不超出容器 */
}

.info-image {
  margin-left: -10px;
  /* 調整這裡的值來靠左 */
}

.info-image img {
  width: 100px;
  height: 100px;
  border-radius: 50px;
  object-fit: cover;
  margin-right: 20px;
  /* 調整這裡的值來靠左 */
}

.info-details {
  text-align: left;
  width: calc(100% - 120px);
  /* 減去圖片的寬度，確保文本不會超出容器 */
  overflow: hidden;
  /* 隱藏超出內容 */
  text-overflow: ellipsis;
  /* 使用省略號表示超出部分 */
  white-space: nowrap;
  /* 防止文本換行 */
  position: relative;
  /* 新增 */
}

.info-container h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.info-container p {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.add-button {
  display: inline-block;
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #e8ae01;
  color: white;
  border: none;
  border-radius: 50px;
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

.info-placeholder {
  text-align: center;
  padding: 50px;
  color: #666;
  font-size: 18px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 10px;
}

.buttons button {
  padding: 5px 10px;
  font-size: 15px;
  background-color: #fae1b6;
  color: rgb(85, 85, 85);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* 新增的 CSS */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  z-index: 11;
}
</style>