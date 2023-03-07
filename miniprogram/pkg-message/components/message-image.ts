import { getWindowSize } from "./screen";

// pkg-message/components/message-image.ts
Component({
  properties: {
    /** 图片地址。 */
    src: { type: String, value: '' },
    /** 图片宽度（像素）。 */
    width: { type: Number, optionalTypes: [String] },
    /** 图片高度（像素）。 */
    height: { type: Number, optionalTypes: [String] },
    /** 是否是自己发送的消息。 */
    // mine: { type: Boolean, value: false }
  },
  data: {
    /** 图片尺寸控制样式 */
    sizeStyle: '',
    /** 真正图片显示的地址 */
    imageSrc: '',
    /** 图片显示的模式 */
    imageMode: 'aspectFill',
    /** 图片加载失败、成功的回调函数名称 */
    imageLoadErrorFn: 'onLoadError',
    imageLoadSuccessFn: 'onLoadSuccess',
  },
  lifetimes: {
    attached() {
      let style = '';
      const windowSize = getWindowSize();
      const maxWidth = Math.floor(windowSize.width * 0.5);
      const maxHeight = Math.floor(maxWidth * 4 / 3);
      if (!this.data.width || !this.data.height) {
        style = `width:${maxWidth}px;height:${maxHeight}px`;
      } else {
        let width = +this.data.width, height = +this.data.height;
        if (width !== height) {
          // 宽图
          if (width > height && width > maxWidth) {
            width = maxWidth;
            height = Math.floor(maxWidth * height / width);
          }
          // 长图
          else if (height > width && height > maxHeight) {
            height = maxHeight;
            width = Math.floor(maxHeight * width / height);
          }
        } else {
          // 方图
          if (width > maxWidth) {
            width = maxWidth;
            height = maxWidth;
          }
        }
        style = `width:${width}px;height:${height}px`;
      }
      this.setData({ sizeStyle: style, imageSrc: this.data.src });
    },
  },
  methods: {
    onLoadError() {
      this.setData({ imageSrc: './image-error.png', imageMode: 'center', imageLoadErrorFn: '', imageLoadSuccessFn: '' });
    },
    onLoadSuccess() {
      const style = this.data.sizeStyle;
      this.setData({ sizeStyle: style + ';background-color:transparent' });
    },
  }
})
