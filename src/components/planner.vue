<template>
  <div class="planner-container">
    <div class="header">
      <h1>我的行程</h1>
      <button v-if="!showCreateItineraryForm" @click="showCreateItineraryForm = true"
        class="new-itinerary-button">建立行程</button>
    </div>
    <div class="itineraries-container" v-if="itineraries.length > 0">
      <div v-for="itinerary in itineraries" :key="itinerary.itinerary_id" class="itinerary-card">
        <h2>{{ itinerary.name }}</h2>
        <p>{{ itinerary.days }} 天行程</p>
        <button @click="showConfirmDelete(itinerary.itinerary_id)" class="delete-button">刪除</button>
        <button @click="selectItineraryAction(itinerary)" class="select-button">行程安排</button>
      </div>
    </div>
    <div v-else>
      <p>目前沒有行程</p>
    </div>
    <div v-if="showCreateItineraryForm" class="modal">
      <div class="modal-content">
        <span class="close" @click="showCreateItineraryForm = false">&times;</span>
        <h3>新建行程</h3>
        <form @submit.prevent="createItinerary" class="form-container">
          <label for="itinerary-name">行程名稱</label>
          <input id="itinerary-name" v-model="newItineraryName" required class="itinerary-name-input">
          <label for="itinerary-days">天數</label>
          <input id="itinerary-days" type="number" v-model.number="newItineraryDays" required min="1" class="itinerary-days-input">
          <button type="submit" class="new-itinerary-button">建立</button>
        </form>
      </div>
    </div>
    <div v-if="showConfirmDialog" class="modal">
      <div class="modal-content">
        <h3>確定要刪除這個行程嗎？</h3>
        <button @click="confirmDelete" class="confirm-button">確定</button>
        <button @click="cancelDelete" class="cancel-button">取消</button>
      </div>
    </div>
  </div>
  <div v-if="showToast" class="toast">選擇成功！</div>
</template>

<script>
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'Planner',
  data() {
    return {
      itineraries: [],
      showCreateItineraryForm: false,
      newItineraryName: '',
      newItineraryDays: 1,
      profile: null,
      errorMessage: '',
      requestUrl: '',
      showConfirmDialog: false,
      itineraryToDelete: null,
      showToast: null,
    };
  },
  computed: {
    ...mapGetters(['getLiffData'])
  },
  mounted() {
    if (this.getLiffData) {
      this.fetchItineraries(this.getLiffData.userId);
    } else {
      this.errorMessage = '獲取LIFF數據失敗';
    }
  },
  methods: {
    ...mapActions(['selectItinerary', 'setSelectedDayIndex']),
    async fetchItineraries(userId) {
      this.errorMessage = '';
      this.requestUrl = `${import.meta.env.VITE_API_BASE_URL}/get_itineraries`;
      try {
        const response = await axios.post(this.requestUrl, { user_id: userId });
        if (response.data.status === 'success') {
          this.itineraries = response.data.itineraries;
        } else {
          this.errorMessage = `後端錯誤: ${response.data.message || '未知錯誤'}`;
        }
      } catch (error) {
        this.errorMessage = `網絡錯誤: ${error.message}. ${error.response ? JSON.stringify(error.response.data) : ''}`;
      }
    },
    async createItinerary() {
      const userId = this.getLiffData.userId;
      if (!userId) {
        this.errorMessage = '無法獲取用戶ID';
        return;
      }
      const newItinerary = {
        itinerary_id: uuidv4(),
        name: this.newItineraryName,
        days: this.newItineraryDays,
        places: Array.from({ length: this.newItineraryDays }, () => [])
      };
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/add_itinerary`, { user_id: userId, itinerary: newItinerary });
        if (response.data.status === 'success') {
          this.itineraries.push(newItinerary);
          this.showCreateItineraryForm = false;
          this.newItineraryName = '';
          this.newItineraryDays = 1;
          this.errorMessage = '';
        } else {
          this.errorMessage = `後端錯誤: ${response.data.message || '未知錯誤'}`;
        }
      } catch (error) {
        this.errorMessage = `網絡錯誤: ${error.message}. ${error.response ? JSON.stringify(error.response.data) : ''}`;
      }
    },
    showConfirmDelete(itineraryId) {
      this.itineraryToDelete = itineraryId;
      this.showConfirmDialog = true;
    },
    async confirmDelete() {
      const userId = this.getLiffData.userId;
      if (!userId) {
        this.errorMessage = '無法獲取用戶ID';
        this.showConfirmDialog = false;
        return;
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delete_itinerary`, { user_id: userId, itinerary_id: this.itineraryToDelete });
        if (response.data.status === 'success') {
          this.itineraries = this.itineraries.filter(itinerary => itinerary.itinerary_id !== this.itineraryToDelete);
          this.errorMessage = '';
          // 清除選中的行程
          if (this.itineraries.length === 0) {
            this.$store.commit('setSelectedItinerary', null);
            this.setSelectedDayIndex(0);
          }
        } else {
          this.errorMessage = `後端錯誤: ${response.data.message || '未知錯誤'}`;
        }
      } catch (error) {
        this.errorMessage = `網絡錯誤: ${error.message}. ${error.response ? JSON.stringify(error.response.data) : ''}`;
      } finally {
        this.showConfirmDialog = false;
        this.itineraryToDelete = null;
      }
    },
    cancelDelete() {
      this.showConfirmDialog = false;
      this.itineraryToDelete = null;
    },
    selectItineraryAction(itinerary) {
      this.selectItinerary(itinerary);
      // this.setSelectedDayIndex(0); // 初始化選中的天數索引為第1天
      this.$router.push('/journey'); // 導航到Journey.vue
    },
  }
};
</script>

<style scoped>
.planner-container {
  background-color: #ebf8fc;
  height: 80vh;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.itineraries-container {
  max-height: 70vh;
  overflow-y: auto;
  margin-bottom: 20px;
}

.itineraries-container h2{
  text-align: left;
  padding-left: 0; /* 確保內邊距為0，文字緊貼左邊 */
  margin-left: 0; /* 確保外邊距為0，文字緊貼左邊 */
}
.itineraries-container p{
  text-align: left;
  padding-left: 0; 
  margin-left: 0; 
}

.itinerary-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
}

.itinerary-card h2 {
  margin: 0 0 10px;
}

.itinerary-card p {
  margin: 0 0 15px;
}

button {
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  padding: 10px 20px;
  font-size: 14px;
  text-align: center;
}

.new-itinerary-button {
  background-color: #28a745;
  color: white;
  margin-bottom: 10px;
}

.delete-button {
  background: none;
  color: #dc3545;
  padding: 0;
  font-weight: bold;  
}

.select-button {
  background-color: #f9f9f9;
  color: #025ec0;
  padding: 5px 10px;
  font-size: 16px;
  position: absolute;
  font-weight: bold;       
  right: 10px;
  top: 10px;
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
  text-align: center;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.form-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.form-container label {
  margin-top: 10px;
}

.form-container input {
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.itinerary-name-input {
  width: 80%;
}
.itinerary-days-input {
  width: 10%;
}
.confirm-button {
  background-color: #28a745;
  color: white;
  margin-right: 10px;
  margin-top: 10px;
}

.cancel-button {
  background-color: #dc3545;
  color: white;
  margin-top: 10px;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
}
</style>
