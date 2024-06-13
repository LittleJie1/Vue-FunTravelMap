<template>
  <div class="planner-container">
    <h1>我的行程</h1>
    <div v-if="itineraries.length > 0">
      <div v-for="itinerary in itineraries" :key="itinerary.itinerary_id" class="itinerary-card">
        <h2>{{ itinerary.name }}</h2>
        <p>{{ itinerary.start_date ? itinerary.start_date : '未設定開始日期' }} - {{ itinerary.end_date ? itinerary.end_date :
          '未設定結束日期' }}</p>
        <p>天數: {{ calculateDays(itinerary.start_date, itinerary.end_date) }}</p>
      </div>
    </div>
    <div v-else>
      <p>目前沒有行程</p>
    </div>
    <button v-if="!showCreateItineraryForm" @click="showCreateItineraryForm = true">新建行程</button>

    <div v-if="showCreateItineraryForm" class="modal">
      <div class="modal-content">
        <span class="close" @click="showCreateItineraryForm = false">&times;</span>
        <h3>新建行程</h3>
        <form @submit.prevent="createItinerary">
          <label for="itinerary-name">行程名稱</label>
          <input id="itinerary-name" v-model="newItineraryName" required>
          <button type="submit">建立</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      itineraries: [],
      showCreateItineraryForm: false,
      newItineraryName: ''
    };
  },
  computed: {
    ...mapGetters(['getLiffData'])
  },
  mounted() {
    if (this.getLiffData) {
      this.fetchItineraries(this.getLiffData.userId);
    }
  },
  methods: {
    async fetchItineraries(userId) {
      try {
        const response = await axios.get(`/get_itineraries?user_id=${userId}`);
        if (response.data.status === 'success') {
          this.itineraries = response.data.itineraries;
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      }
    },
    calculateDays(startDate, endDate) {
      if (!startDate || !endDate) return '未設定天數';
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    async createItinerary() {
      const userId = this.getLiffData.userId;
      if (!userId) return;

      const newItinerary = {
        itinerary_id: uuidv4(),
        name: this.newItineraryName,
        start_date: null, // 未來設置
        end_date: null, // 未來設置
        places: []
      };

      try {
        const response = await axios.post('http://127.0.0.1:5000/add_itinerary', { user_id: userId, itinerary: newItinerary });
        if (response.data.status === 'success') {
          this.itineraries.push(newItinerary);
          this.showCreateItineraryForm = false;
          this.newItineraryName = '';
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Error creating itinerary:', error);
      }
    }
  }
};
</script>

<style scoped>
.planner-container {
  padding: 20px;
}

.itinerary-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.itinerary-card h2 {
  margin: 0 0 10px;
}

.itinerary-card p {
  margin: 0 0 15px;
}

button {
  background-color: #63a5eb;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  padding: 10px 20px;
  font-size: 14px;
  text-align: center;
}

button:hover {
  background-color: #4d94e6;
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0, 0, 0);
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  max-width: 300px;
  border-radius: 8px;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>
