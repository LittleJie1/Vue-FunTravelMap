<template>
  <div class="journey-container" v-if="selectedItinerary">
    <div class="header">
      <h1>{{ selectedItinerary.name }}</h1>
      <button @click="optimizeRoute" class="optimize-button">最佳路線</button>
      <button @click="goBack" class="back-button">返回</button>
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
    <div class="places-container">
      <Container @drop="onDrop">
        <Draggable v-for="(place, index) in selectedDayPlaces" :key="place.place_id">
          <div class="place-card" :class="{ 'visited-place': place.visited }">
            <div class="place-buttons">
              <button v-if="index !== 0" @click="movePlace(index, 'up')">▲</button>
              <button v-if="index !== selectedDayPlaces.length - 1" @click="movePlace(index, 'down')">▼</button>
            </div>
            <h3>{{ place.name }}</h3>
            <button @click="deletePlace(index)" class="delete-button">✖</button>
          </div>
        </Draggable>
      </Container>
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
      dayPlaces: [] // 可變的 dayPlaces 數據屬性
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
  font-size: 18px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  /* 將文本對齊到左側 */
}
/* 最佳路線按鈕 */
.optimize-button {
  background-color: #04bc1a;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
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
}

/* 天數按鈕 */
.days-container button {
  flex: 0 0 auto;
  padding: 5px 10px;
  /* 調整內邊距以獲得更好的對齊 */
  border: none;
  background: none;
  color: #7e848a;
  font-size: 16px;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  line-height: 24px;
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
  border-radius: 50%;
  cursor: pointer;
  color: #007bff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

/* 地點容器 */
.places-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  background-color: #aff4af; /* 設定已拜訪地點卡片的背景色 */
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
  font-size: 18px;
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
  margin-left: auto;
  /* 確保刪除按鈕在最右側 */
}

/* 返回按鈕 */
.back-button {
  background-color: #998e86;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>
