import { createStore } from 'vuex';

export default createStore({
  state: {
    liffData: null,
    selectedItinerary: null, // 存储选中的行程对象
  },
  mutations: {
    setLiffData(state, liffData) {
      state.liffData = liffData;
    },
    setSelectedItinerary(state, itinerary) {
      state.selectedItinerary = itinerary; // 存储选中的行程对象
    },
  },
  actions: {
    updateLiffData({ commit }, liffData) {
      commit('setLiffData', liffData);
    },
    selectItinerary({ commit }, itinerary) {
      commit('setSelectedItinerary', itinerary); // 存储选中的行程对象
    },
  },
  getters: {
    getLiffData: state => state.liffData,
    selectedItinerary: state => state.selectedItinerary, // 获取选中的行程对象
  },
});
