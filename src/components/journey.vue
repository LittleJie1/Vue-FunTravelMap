<template>
  <div>
    <div class="journey-container" v-if="selectedItinerary">
      <div class="header">
        <h1>{{ selectedItinerary.name }}</h1>
        <button @click="optimizeRoute" class="optimize-button">最佳路線</button>
        <button @click="goBack" class="back-button">返回</button>
      </div>
      <div class="city-selection">
        <label for="city-select">趣旅i推薦：</label>
        <select id="city-select" v-model="selectedCity">
          <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
        </select>
        <button @click="openConfirmationDialog" class="confirm-button">確認</button>
      </div>
      <div class="days-container-wrapper">
        <div class="days-container">
          <button v-for="(day, index) in daysArray" :key="index" @click="selectDay(index)"
            :class="{ 'selected-day': index === selectedDayIndex }">
            第 {{ index + 1 }} 天
          </button>
        </div>
        <div class="modify-buttons">
          <button @click="addDay" class="modify-day-button">+</button>
          <button @click="removeDay" class="modify-day-button">-</button>
        </div>
      </div>
      <div v-if="selectedDayPlaces.length > 0" class="places-container">
        <Container @drop="onDrop">
          <Draggable v-for="(place, index) in selectedDayPlaces" :key="place.place_id">
            <div class="place-card" :class="{ 'visited-place': place.visited }">
              <div class="place-buttons">
                <button v-if="index !== 0" @click="movePlace(index, 'up')">▲</button>
                <button v-if="index !== selectedDayPlaces.length - 1" @click="movePlace(index, 'down')">▼</button>
              </div>
              <h3>{{ place.name }}</h3>
              <button @click="navigateToPlace(place)" class="navigate-button">▶</button>
              <button @click="deletePlace(index)" class="delete-button">✖</button>
            </div>
          </Draggable>
        </Container>
        <div class="dynamic-placeholder">
          調整景點順序<br>
          請點▲▼ 或 久按拖曳
        </div>
      </div>
      <div v-else class="no-places-placeholder">
        點擊上方欲安排的天數<br>返回
        <span style="font-weight: bold; color: #00A600;">找景點</span>安排行程<br><br><br>
      </div>
    </div>
    <div v-if="showConfirmationDialog">
      <div class="overlay" @click="closeConfirmationDialog"></div>
      <div class="confirmation-dialog">
        <div class="dialog-content">
          <p>i推薦處理需要些時間<br>且會取代所有已排行程<br>請再次確認</p>
          <div class="dialog-buttons">
            <button @click="confirmCitySelection">確定</button>
            <button @click="closeConfirmationDialog">取消</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import axios from 'axios';
import { Container, Draggable } from 'vue3-smooth-dnd';

function applyDrag(arr, dragResult) {
  const { removedIndex, addedIndex, payload } = dragResult;
  if (removedIndex === null && addedIndex === null) return arr;

  const result = [...arr];
  let itemToAdd = payload;

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0];
  }
  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd);
  }
  return result;
}

export default {
  name: 'Journey',
  components: {
    Container,
    Draggable
  },
  data() {
    return {
      dayPlaces: [], // 可變的 dayPlaces 數據屬性
      selectedCity: '',
      cities: ['台北市', '新北市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉義市', '桃園市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'], // 縣市列表
      showConfirmationDialog: false,
      loading: false
    };
  },
  computed: {
    ...mapGetters(['selectedItinerary', 'selectedDayIndex']),
    daysArray() {
      return this.selectedItinerary ? Array.from({ length: this.selectedItinerary.days }, (_, index) => index + 1) : [];
    },
    selectedDayPlaces() {
      if (this.selectedItinerary && Array.isArray(this.selectedItinerary.places)) {
        return this.selectedItinerary.places[this.selectedDayIndex] || [];
      }
      return [];
    }
  },
  watch: {
    selectedItinerary(newItinerary) {
      if (newItinerary && newItinerary.itinerary_id) {
        this.dayPlaces = [...this.selectedDayPlaces];
      }
    },
    selectedDayPlaces(newPlaces) {
      this.dayPlaces = [...newPlaces];
    },
    selectedDayIndex() {
      this.dayPlaces = [...this.selectedDayPlaces];
    }
  },
  mounted() {
    if (this.selectedItinerary && this.selectedItinerary.itinerary_id) {
      this.dayPlaces = [...this.selectedDayPlaces];
    }
  },
  methods: {
    ...mapActions(['setSelectedDayIndex', 'selectItinerary']),
    selectDay(index) {
      this.setSelectedDayIndex(index);
      this.dayPlaces = [...this.selectedDayPlaces];
    },
    goBack() {
      this.$router.push('/planner');
    },
    async addDay() {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/add_day`, {
          itinerary_id: this.selectedItinerary.itinerary_id
        });
        if (response.data.status === 'success') {
          this.selectedItinerary.days += 1;
          this.selectedItinerary.places.push([]);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error adding day:', error);
      }
    },
    async removeDay() {
      if (this.selectedItinerary.days > 1) {
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/remove_day`, {
            itinerary_id: this.selectedItinerary.itinerary_id
          });
          if (response.data.status === 'success') {
            this.selectedItinerary.days -= 1;
            this.selectedItinerary.places.pop();
            if (this.selectedDayIndex >= this.selectedItinerary.days) {
              this.setSelectedDayIndex(this.selectedItinerary.days - 1);
            }
          } else {
            console.error(response.data.message);
          }
        } catch (error) {
          console.error('Error removing day:', error);
        }
      }
    },
    async movePlace(index, direction) {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/move_place`, {
          itinerary_id: this.selectedItinerary.itinerary_id,
          day_index: this.selectedDayIndex,
          place_index: index,
          direction: direction
        });
        if (response.data.status === 'success') {
          const movedPlace = this.dayPlaces.splice(index, 1)[0];
          if (direction === 'up') {
            this.dayPlaces.splice(index - 1, 0, movedPlace);
          } else {
            this.dayPlaces.splice(index + 1, 0, movedPlace);
          }
          this.updatePlaceOrder();
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error moving place:', error);
      }
    },
    async deletePlace(index) {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delete_place`, {
          itinerary_id: this.selectedItinerary.itinerary_id,
          day_index: this.selectedDayIndex,
          place_index: index
        });
        if (response.data.status === 'success') {
          this.dayPlaces.splice(index, 1);
          this.updatePlaceOrder();
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error deleting place:', error);
      }
    },
    async optimizeRoute() {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/optimize_route`, {
          itinerary_id: this.selectedItinerary.itinerary_id,
          day_index: this.selectedDayIndex
        });
        if (response.data.status === 'success') {
          this.selectedItinerary.places[this.selectedDayIndex] = response.data.route;
          this.dayPlaces = [...response.data.route];
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error optimizing route:', error);
      }
    },
    openConfirmationDialog() {
      this.showConfirmationDialog = true;
    },
    closeConfirmationDialog() {
      this.showConfirmationDialog = false;
    },
    async confirmCitySelection() {
      this.loading = true;
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/process_city_selection`, {
          city_name: this.selectedCity,
          itinerary_id: this.selectedItinerary.itinerary_id,
          day_index: this.selectedDayIndex
        });
        if (response.data.status === 'success') {
          this.selectedItinerary.places[this.selectedDayIndex] = response.data.places;
          this.dayPlaces = [...response.data.places];
          this.showConfirmationDialog = false;
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error processing city selection:', error);
      } finally {
        this.loading = false;
      }
    },
    onDrop(dropResult) {
      this.dayPlaces = applyDrag(this.dayPlaces, dropResult);
      this.updatePlaceOrder();
    },
    async updatePlaceOrder() {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/update_place_order`, {
          itinerary_id: this.selectedItinerary.itinerary_id,
          day_index: this.selectedDayIndex,
          places: this.dayPlaces
        });
        if (response.data.status !== 'success') {
          console.error(response.data.message);
        } else {
          // Ensure the selectedItinerary is also updated
          this.selectedItinerary.places[this.selectedDayIndex] = [...this.dayPlaces];
        }
      } catch (error) {
        console.error('Error updating place order:', error);
      }
    },
    navigateToPlace(place) {
      const lat = place.latitude;
      const lng = place.longitude;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.location.href = url;
    }
  }
};
</script>

<style scoped>
/* 行程容器 */
.journey-container {
  padding: 20px;
}

/* 頭部區域 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header h1 {
  flex-grow: 1;
  font-size: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  /* 將文本對齊到左側 */
}

/* 縣市選擇區域 */
.city-selection {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.city-selection label {
  font-size: 14px;
}

.city-selection select {
  padding: 5px;
  margin-right: 10px;
  font-size: 12px;
}

.city-selection .confirm-button {
  color: rgb(86, 74, 74);
  border: none;
  font-size: 12px;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
}

/* 智能推薦提醒 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.confirmation-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 10px;
  z-index: 1000;
  width: 55%;
  padding: 20px;
}

.dialog-content {
  text-align: center;
}

.dialog-content p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
}

.dialog-buttons button {
  background-color: #079500;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}
.dialog-buttons button:hover {
  background-color: #0056b3;
}

.dialog-buttons button:nth-child(2) {
  background-color: #6c757d;
}

.dialog-buttons button:nth-child(2):hover {
  background-color: #5a6268;
}

/* 加載指示器覆蓋層 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 加載指示器 */
.loading-spinner {
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 最佳路線按鈕 */
.optimize-button {
  background-color: #508fed;
  color: rgb(255, 251, 251);
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-weight: bold; 
  cursor: pointer;
  margin-left: 10px;
}

/* 天數容器包裹 */
.days-container-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

/* 天數容器 */
.days-container {
  display: flex;
  overflow-x: auto;
  gap: 5px;
  flex-grow: 1;
  margin-right: 40px; /* 調整這裡的 margin-right 以增加空間 */
}

/* 天數按鈕 */
.days-container button {
  flex: 0 0 auto;
  padding: 5px 10px;
  /* 調整內邊距以獲得更好的對齊 */
  border: none;
  background: none;
  color: #7e848a;
  font-size: 15px;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  line-height: 26px;
  /* 確保一致的高度 */
}

/* 天數按鈕動畫 */
.days-container button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  /* 調整底部位置以獲得一致的下劃線 */
  width: 100%;
  height: 2px;
  background-color: #3c4248;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease-out;
}

/* 選中天數按鈕 */
.days-container .selected-day::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

/* 修改按鈕容器 */
.modify-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 10px;
  position: absolute;
  right: 0;
}

/* 修改天數按鈕 */
.modify-day-button {
  width: 30px;
  height: 30px;
  background-color: #e0e0e0;
  border: none;
  cursor: pointer;
  color: #020202;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
}

/* 地點容器 */
.places-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 沒有地點提示容器 */
.no-places-placeholder {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

/* 動態提示容器 */
.dynamic-placeholder {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 16px;
}

/* 地點卡片 */
.place-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 確保元素間有足夠的空間分隔 */
}

/* 已拜訪地點卡片 */
.visited-place {
  background-color: #aff4af;
  /* 設定已拜訪地點卡片的背景色 */
}

/* 上下移動按鈕 */
.place-buttons {
  display: flex;
  flex-direction: column;
  margin-right: 10px;
}

.place-buttons button {
  background: none;
  color: rgb(247, 175, 104);
  border: none;
  cursor: pointer;
  font-size: 16px;
}

/* 地點名稱 */
.place-card h3 {
  flex-grow: 1;
  font-size: 16px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  /* 將文本對齊到左側 */
}

/* 刪除按鈕 */
.delete-button {
  background: none;
  border: none;
  color: rgb(170, 4, 4);
  cursor: pointer;
  font-size: 20px;
  padding-right: 0;
  /* 確保刪除按鈕在最右側 */
}

/* 新增導航按鈕樣式 */
.navigate-button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 16px;
  padding-right: 5px;
}

/* 返回按鈕 */
.back-button {
  background-color: #998e86;
  color: white;
  border: none;
  font-weight: bold; 
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>