<template>
  <div v-if="checkinDetails" class="checkin-details-container">
    <!-- 編輯名稱部分 -->
    <div v-if="isEditingName">
      <input type="text" v-model="checkinDetails.checkinName">
      <button @click="saveCheckinName" class="button">保存名稱</button>
    </div>
    <div v-else>
      <h1>{{ checkinDetails.checkinName }}</h1>
      <button @click="enableEditing('name')" class="button">編輯名稱</button>
    </div>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <!-- 顯示時間 -->
    <div>
      <p>時間: {{ new Date(checkinDetails.timestamp).toLocaleString() }}</p>
    </div>

    <!-- 返回按钮 -->
    <button @click="goBack" class="button">返回</button>

    <!-- 編輯描述部分 -->
    <div v-if="isEditingMemory">
      <label for="description">描述：</label>
      <textarea id="description" v-model="checkinDetails.description"></textarea>
      <button @click="saveDescription" class="button">保存描述</button>
    </div>
    <div v-else>
      <p v-if="checkinDetails.description">描述: {{ checkinDetails.description }}</p>
      <button @click="enableEditing('memory')" class="button">編輯描述</button>
    </div>

    <!-- 上傳照片部分 -->
    <div>
      <label for="photos" class="button">上傳照片</label>
      <input type="file" id="photos" @change="onFileChange" multiple style="display: none;">
    </div>

    <!-- 照片顯示區域 -->
    <div class="photos-container">
      <div v-for="(photo, index) in checkinDetails.photos" :key="index" class="photo-container">
        <img :src="photo" alt="Checkin Photo" @click="showPhoto(photo)" class="thumbnail">
      </div>
    </div>

    <!-- 照片彈窗 -->
    <div v-if="isPhotoModalVisible" class="modal">
      <div class="modal-content">
        <span class="close-button" @click="closePhotoModal">&times;</span>
        <img :src="currentPhotoUrl" alt="Checkin Photo" class="modal-image">
        <button @click="confirmDeletePhoto" class="delete-button-modal">刪除照片</button>
        <button @click="setAsHomepage" class="set-homepage-button">設為主頁</button>
      </div>
    </div>

    <!-- 確認刪除彈窗 -->
    <div v-if="isConfirmDeleteVisible" class="confirm-modal">
      <div class="confirm-content">
        <p>確認刪除這張照片嗎？</p>
        <button @click="deletePhoto" class="button">確定</button>
        <button @click="cancelDeletePhoto" class="button">取消</button>
      </div>
    </div>

    <!-- 自訂彈窗 -->
    <div v-if="isAlertVisible" class="alert-modal">
      <div class="alert-content">
        <span class="alert-message">{{ alertMessage }}</span>
        <button @click="closeAlert" class="alert-button">確定</button>
      </div>
    </div>

    <!-- Toast提示 -->
    <div v-if="showToastFlag" class="toast">{{ toastMessage }}</div>
  </div>
  <div v-else>
    <p>加載中...</p>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'DetailView',
  props: ['timestamp', 'checkinId'],
  data() {
    return {
      checkinDetails: null,
      errorMessage: '',
      isEditingName: false,
      isEditingMemory: false,
      isPhotoModalVisible: false,
      isConfirmDeleteVisible: false,
      currentPhotoUrl: null,
      files: [],
      isAlertVisible: false,
      alertMessage: '',
      showToastFlag: false,
      toastMessage: ''
    };
  },
  computed: {
    ...mapGetters(['getLiffData'])
  },
  mounted() {
    this.userProfile = this.getLiffData;
    if (this.userProfile) {
      this.loadCheckinDetails();
    } else {
      this.errorMessage = '獲取LIFF數據失敗';
    }
  },
  methods: {
    loadCheckinDetails() {
      const checkinId = this.checkinId;
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/checkin/${checkinId}`, {})
        .then(response => {
          this.checkinDetails = response.data;
        })
        .catch(error => {
          this.handleError(error, 'Error fetching check-in details');
        });
    },
    enableEditing(type) {
      this.isEditingName = type === 'name';
      this.isEditingMemory = type === 'memory';
    },
    saveCheckinName() {
      const checkinId = this.checkinId;
      const formData = new FormData();
      formData.append('checkinId', checkinId);
      formData.append('checkinName', this.checkinDetails.checkinName);

      axios.post(`${import.meta.env.VITE_API_BASE_URL}/update_checkin`, formData)
        .then(() => {
          console.log('Check-in name updated successfully');
          this.showToast('打卡名稱已保存');
          this.isEditingName = false;
        })
        .catch(error => {
          this.handleError(error, 'Error updating check-in name');
        });
    },
    onFileChange(event) {
      const newFiles = Array.from(event.target.files);
      if ((this.checkinDetails.photos ? this.checkinDetails.photos.length : 0) + newFiles.length > 9) {
        this.showAlert('最多只能上傳9張照片');
        return;
      }
      this.files = newFiles;

      const checkinId = this.checkinId;
      const formData = new FormData();
      formData.append('checkinId', checkinId);

      if (!this.userProfile || !this.userProfile.userId) {
        this.handleError(new Error('User profile not loaded'), 'Error uploading photo');
        return;
      }

      formData.append('userId', this.userProfile.userId);

      this.files.forEach((file, index) => {
        formData.append(`photos`, file);
      });

      axios.post(`${import.meta.env.VITE_API_BASE_URL}/update_checkin`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(() => {
        console.log('Photos uploaded successfully');
        this.showToast('照片已上傳');
        this.files = [];
        this.loadCheckinDetails();
      })
      .catch(error => {
        this.handleError(error, 'Error uploading photos');
      });
    },
    showAlert(message) {
      this.alertMessage = message;
      this.isAlertVisible = true;
    },
    closeAlert() {
      this.isAlertVisible = false;
      this.alertMessage = '';
    },
    saveDescription() {
      const checkinId = this.checkinId;
      const formData = new FormData();
      formData.append('checkinId', checkinId);
      formData.append('description', this.checkinDetails.description);

      axios.post(`${import.meta.env.VITE_API_BASE_URL}/update_checkin`, formData)
        .then(() => {
          console.log('Check-in description updated successfully');
          this.showToast('描述已保存');
          this.isEditingMemory = false;
        })
        .catch(error => {
          this.handleError(error, 'Error updating check-in description');
        });
    },
    showPhoto(photoUrl) {
      this.currentPhotoUrl = photoUrl;
      this.isPhotoModalVisible = true;
    },
    closePhotoModal() {
      this.isPhotoModalVisible = false;
    },
    confirmDeletePhoto() {
      this.isConfirmDeleteVisible = true;
    },
    cancelDeletePhoto() {
      this.isConfirmDeleteVisible = false;
    },
    deletePhoto() {
      const checkinId = this.checkinId;
      const photoUrl = this.currentPhotoUrl;
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/delete_photo`, {
        checkinId,
        photoUrl,
      })
        .then(() => {
          console.log('Photo deleted successfully');
          this.showToast('照片已刪除');
          this.isPhotoModalVisible = false;
          this.isConfirmDeleteVisible = false;
          this.loadCheckinDetails();
        })
        .catch(error => {
          this.handleError(error, 'Error deleting photo');
        });
    },
    setAsHomepage() {
      const checkinId = this.checkinId;
      const photoUrl = this.currentPhotoUrl;
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/set_homepage_photo`, {
        checkinId,
        photoUrl,
      })
        .then(() => {
          console.log('Photo set as homepage successfully');
          this.showToast('已新增為主頁');
          this.isPhotoModalVisible = false;
          this.loadCheckinDetails();
        })
        .catch(error => {
          this.handleError(error, 'Error setting photo as homepage');
        });
    },
    goBack() {
      this.$router.go(-1);
    },
    handleError(error, message) {
      this.errorMessage = message + ': ' + error.message;
      console.error(message, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    },
    showToast(message) {
      this.toastMessage = message;
      this.showToastFlag = true;
      setTimeout(() => {
        this.showToastFlag = false;
      }, 3000);
    }
  }
};
</script>

<style scoped>
.checkin-details-container {
  padding-bottom: 80px; /* 確保不會覆蓋底部導航按鈕 */
}

.error-message {
  color: red;
}

.select-button {
  margin-top: 10px;
}

/* 限制圖片初始大小 */
.thumbnail {
  width: 100px; /* 設置寬度為100px */
  height: 100px; /* 設置高度為100px */
  object-fit: cover; /* 保持圖片比例 */
  cursor: pointer;
}

/* 照片彈窗 */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.9);
}

.modal-content {
  position: relative;
  margin: auto;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  text-align: center; /* 使內容居中 */
}

.close-button {
  position: absolute;
  top: 10px;
  right: 25px;
  color: white;
  font-size: 35px;
  font-weight: bold;
  cursor: pointer;
}

.modal-image {
  width: 100%;
}

.delete-button-modal {
  margin-right: 90px;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
}

.set-homepage-button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: green;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
}

/* 確認刪除彈窗 */
.confirm-modal {
  position: fixed;
  z-index: 2000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.5);
}

.confirm-content {
  position: relative;
  margin: auto;
  padding: 20px;
  width: 300px;
  background-color: white;
  text-align: center;
  border-radius: 10px;
}

.confirm-content p {
  margin-bottom: 20px;
}

/* 照片容器 */
.photos-container {
  max-height: 400px; /* 設置最大高度 */
  overflow-y: auto; /* 允許垂直滾動 */
  margin-top: 10px;
}

.photo-container {
  display: inline-block;
  position: relative;
  margin: 10px;
}

/* 自訂彈窗 */
.alert-modal {
  position: fixed;
  z-index: 2000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.5);
}

.alert-content {
  position: relative;
  margin: auto;
  padding: 20px;
  width: 300px;
  background-color: white;
  text-align: center;
  border-radius: 10px;
}

.alert-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* Toast提示 */
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

.button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #63a5eb;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}
</style>
