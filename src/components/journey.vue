<template>
  <div class="journey-container">
    <div class="header">
      <h1>{{ selectedItinerary.name }}</h1>
      <button @click="goBack" class="back-button">返回</button>
    </div>
    <div class="days-container-wrapper">
      <div class="days-container">
        <button v-for="(day, index) in daysArray" :key="index" @click="selectDay(index)"
                :class="{'selected-day': index === selectedDayIndex}">
          第 {{ index + 1 }} 天
        </button>
      </div>
      <div class="modify-buttons">
        <button @click="addDay" class="modify-day-button">+</button>
        <button @click="removeDay" class="modify-day-button">-</button>
      </div>
    </div>
    <div class="places-container">
      <div v-for="place in selectedDayPlaces" :key="place.place_id" class="place-card">
        <h3>{{ place.name }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import axios from 'axios';

export default {
  name: 'Journey',
  computed: {
    ...mapGetters(['selectedItinerary', 'selectedDayIndex']),
    daysArray() {
      return Array.from({ length: this.selectedItinerary.days }, (_, index) => index + 1);
    },
    selectedDayPlaces() {
      if (this.selectedItinerary && Array.isArray(this.selectedItinerary.places)) {
        return this.selectedItinerary.places[this.selectedDayIndex] || [];
      }
      return [];
    }
  },
  methods: {
    ...mapActions(['setSelectedDayIndex']),
    selectDay(index) {
      this.setSelectedDayIndex(index);
    },
    goBack() {
      this.$router.push('/planner');
    },
    async addDay() {
      try {
        const response = await axios.post('https://3f91-220-132-106-138.ngrok-free.app/add_day', {
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
          const response = await axios.post('https://3f91-220-132-106-138.ngrok-free.app/remove_day', {
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
  padding: 5px 10px; /* 調整內邊距以獲得更好的對齊 */
  border: none;
  background: none;
  color: #7e848a;
  font-size: 16px;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  line-height: 24px; /* 確保一致的高度 */
}

/* 天數按鈕動畫 */
.days-container button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0; /* 調整底部位置以獲得一致的下劃線 */
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
}

/* 返回按鈕 */
.back-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>
