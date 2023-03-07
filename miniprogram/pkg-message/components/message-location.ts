// pkg-message/components/message-location.ts
Component({
  properties: {
    /** 经度。 */
    lng: { type: Number, optionalTypes: [String] },
    /** 纬度。 */
    lat: { type: Number, optionalTypes: [String] },
    /** 地址。 */
    address: String,
  },
  data: {
    mapSrc: ''
  },
  lifetimes: {
    attached() {
      if (!this.data.lng || !this.data.lat) {
        return this.setData({ mapSrc: './location-map.png' });
      }
      const points = this.data.lng + ',' + this.data.lat;
      const mapWidth = 300;
      const mapHeight = 150;
      const imageUrl = `https://restapi.amap.com/v3/staticmap?key=e9049f7605843c926ccc3d8c97afaf63&zoom=13&size=${mapWidth}*${mapHeight}&scale=2&markers=large,0xFF0000,:${ points }&location=${ points }`;
      this.setData({ mapSrc: imageUrl });
    },
  },
  methods: {
    openLocation() {
      if (!this.data.lng || !this.data.lat) {
        return wx.showToast({ title: '获取位置失败', icon: 'error', success(){} });
      }
      wx.openLocation({
        latitude: +this.data.lat,
        longitude: +this.data.lng,
        address: this.data.address
      });
    }
  }
})
