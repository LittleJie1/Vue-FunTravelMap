import { createStore } from 'vuex';

export default createStore({
  state: {
    liffData: null,
    selectedItinerary: null, // 儲存選取的行程對象
    selectedDayIndex: 0 // 儲存選取的天數索引
  },
  mutations: {
    setLiffData(state, liffData) {
      state.liffData = liffData;
    },
    setSelectedItinerary(state, itinerary) {
      state.selectedItinerary = itinerary; // 儲存選取的行程對象
    },
    setSelectedDayIndex(state, index) {
      state.selectedDayIndex = index; // 儲存選取的天數索引
    }
  },
  actions: {
    updateLiffData({ commit }, liffData) {
      commit('setLiffData', liffData);
    },
    selectItinerary({ commit }, itinerary) {
      commit('setSelectedItinerary', itinerary); // 儲存選取的行程對象
    },
    setSelectedDayIndex({ commit }, index) {
      commit('setSelectedDayIndex', index); // 儲存選取的天數索引
    }
  },
  getters: {
    getLiffData: state => state.liffData,
    selectedItinerary: state => state.selectedItinerary, // 取得選取的行程對象
    selectedDayIndex: state => state.selectedDayIndex // 取得選取的天數索引
  },
});
