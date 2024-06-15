<template>
  <div class="planner-container">
    <div class="header">
      <h1>我的行程</h1>
      <button v-if="!showCreateItineraryForm" @click="showCreateItineraryForm = true" class="new-itinerary-button">新建行程</button>
    </div>
    <div class="itineraries-container" v-if="itineraries.length > 0">
      <div v-for="itinerary in itineraries" :key="itinerary.itinerary_id" class="itinerary-card">
        <h2>{{ itinerary.name }}</h2>
        <p>天數: {{ calculateDays(itinerary.start_date, itinerary.end_date) }}</p>
        <button @click="showConfirmDelete(itinerary.itinerary_id)" class="delete-button">刪除</button>
        <button @click="selectItinerary(itinerary)" class="select-button">選擇</button> <!-- 新增選擇按鈕 -->
      </div>
    </div>
    <div v-else>
      <p>目前沒有行程</p>
    </div>
    <div v-if="showCreateItineraryForm" class="modal">
      <div class="modal-content">
        <span class="close" @click="showCreateItineraryForm = false">&times;</span>
        <h3>新建行程</h3>
        <form @submit.prevent="createItinerary">
          <label for="itinerary-name">行程名稱</label>
          <input id="itinerary-name" v-model="newItineraryName" required>
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
  <!-- <div v-if="profile">
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div class="debug-info">
      <h3>調試信息</h3>
      <p>Request URL: {{ requestUrl }}</p>
    </div>
  </div> -->
</template>

<script>
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      itineraries: [],
      showCreateItineraryForm: false,
      newItineraryName: '',
      profile: null,
      errorMessage: '', // 添加錯誤訊息屬性
      requestUrl: '', // 添加 requestUrl 屬性
      showConfirmDialog: false,  // 控制自定義確認對話框的顯示
      itineraryToDelete: null,  // 要刪除的行程ID
    };
  },
  computed: {
    ...mapGetters(['getLiffData'])
  },
  mounted() {
    if (this.getLiffData) {
      // this.userId = this.getLiffData.userId;
      // this.profile = this.getLiffData;
      this.fetchItineraries(this.getLiffData.userId);
    } else {
      this.errorMessage = '獲取LIFF數據失敗';
    }
  },
  methods: {
    ...mapActions(['selectItinerary']),
    async fetchItineraries(userId) {  //顯示我的行程
      this.errorMessage = '';
      this.requestUrl = `https://eeef-220-132-106-138.ngrok-free.app/get_itineraries`;
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
    calculateDays(startDate, endDate) {
      if (!startDate || !endDate) return '未設定天數';
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    async createItinerary() {   //創建行程
      const userId = this.getLiffData.userId;
      if (!userId) {
        this.errorMessage = '無法獲取用戶ID';
        return;
      }

      const newItinerary = {
        itinerary_id: uuidv4(),
        name: this.newItineraryName,
        start_date: null, // 未來設置
        end_date: null, // 未來設置
        places: []
      };

      try {
        const response = await axios.post('https://eeef-220-132-106-138.ngrok-free.app/add_itinerary', { user_id: userId, itinerary: newItinerary });
        if (response.data.status === 'success') {
          this.itineraries.push(newItinerary);
          this.showCreateItineraryForm = false;
          this.newItineraryName = '';
          this.errorMessage = ''; // 清除錯誤訊息
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
        const response = await axios.post('https://eeef-220-132-106-138.ngrok-free.app/delete_itinerary', { user_id: userId, itinerary_id: this.itineraryToDelete });
        if (response.data.status === 'success') {
          this.itineraries = this.itineraries.filter(itinerary => itinerary.itinerary_id !== this.itineraryToDelete);
          this.errorMessage = '';
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
    }
  }
};
</script>

<style scoped>
.planner-container {
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
  background-color: #63a5eb;
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
}

.select-button {
  background-color: #007bff;
  color: white;
  padding: 5px 10px;
  font-size: 12px;
  position: absolute;
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

</style>
