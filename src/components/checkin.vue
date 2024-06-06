<template>
  <div>
    <div id="map" ref="map" class="map"></div>
    <button @click="resetMap" class="reset-button">清除标记</button>
  </div>
</template>

<script>
/* global google */
export default {
  name: 'MapView',
  data() {
    return {
      map: null,
      markers: [],
      savedState: {},
      taiwanBounds: {
        north: 28,
        south: 20,
        east: 123,
        west: 117,
      }
    };
  },
  mounted() {
    if (localStorage.getItem('mapState')) {
      this.savedState = JSON.parse(localStorage.getItem('mapState'));
    }
    this.loadMapScript();
  },
  methods: {
    loadMapScript() {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyASHb6WIbfA0TkqvWtDzv5hELC_o2kyPO4&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      window.initMap = this.initMap;
    },
    initMap() {
      this.map = new google.maps.Map(this.$refs.map, {
        center: { lat: 23.6978, lng: 120.9605 },
        zoom: 8,
        minZoom: 8,
        restriction: {
          latLngBounds: this.taiwanBounds,
          strictBounds: false,
        },
        fullscreenControl: false,
      });

      this.map.setCenter({ lat: 23.6978, lng: 120.9605 });

      this.map.addListener('click', (event) => {
        const position = event.latLng;
        this.addMarker(position);

        const positionKey = `${position.lat()}_${position.lng()}`;
        this.savedState[positionKey] = true;
        localStorage.setItem('mapState', JSON.stringify(this.savedState));
      });

      for (const key in this.savedState) {
        const [lat, lng] = key.split('_').map(Number);
        this.addMarker(new google.maps.LatLng(lat, lng));
      }
    },
    addMarker(position) {
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        icon: {
          url: '/flag.png',
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      const infoWindowContent = document.createElement('div');
      infoWindowContent.innerHTML = '這是一個訊息窗口<button id="edit-btn">編輯</button>';

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: true,
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
        this.$nextTick(() => {
          const editBtn = document.getElementById('edit-btn');
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              this.editMarker();
            });
          }
        });
      });

      this.markers.push(marker);
    },
    editMarker() {
      this.$router.push({ name: 'DetailView' });
    },
    resetMap() {
      localStorage.removeItem('mapState');
      this.savedState = {};

      for (let marker of this.markers) {
        marker.setMap(null);
      }
      this.markers = [];
    },
  },
};
</script>

<style>
.map {
  height: 80vh;
  width: 100%;
}

.reset-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 5;
  background-color: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
