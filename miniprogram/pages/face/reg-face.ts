import { readImageAsBase64 } from "../../libs/bdface/index";
import { requirePermission } from "../../libs/authorize";
import { alertErrorMessage } from "../../libs/modal";
import { registFace } from "../../services/face";

Component({
  options: {
    pureDataPattern: /^_/,
  },
  data: {
    cameraDir: 'front' as 'front' | 'back',
    cameraReady: false,
    hasPermission: false,
    showPreviewPanel: false,
    previewImgSrc: '',
    _base64: '',
    _localImgPath: '',
  },
  methods: {
    onLoad() {
      this.requireCameraPermission();
    },
    postFace() {
      const vm = this;
      wx.showLoading({ title: '处理中', mask: true });
      const hl = () => wx.hideLoading();
      registFace(vm.data._base64).then(() => {
        hl();
        wx.showToast({ title: '提交成功', icon: 'success' });
        vm.setData({ showPreviewPanel: false, cameraReady: false });
        setTimeout(() => {
          vm.pageRouter.navigateBack();
        }, 1000);
      }).catch((err: HandledError) => {
        hl();
        alertErrorMessage(err, {
          title: '提交失败',
          content: '人脸图像提交失败。'
        });
      });
    },
    takePhoto() {
      const vm = this;
      vm.requireCameraPermission().then(() => {
        const camera = wx.createCameraContext();
        camera.takePhoto({
          quality: 'normal',
          success: (res) => {
            wx.showLoading({ title: '预览中' });
            readImageAsBase64(res.tempImagePath).then(img => {
              vm.setData({ previewImgSrc: img.fullBase64, _base64: img.base64, _localImgPath: res.tempImagePath, showPreviewPanel: true });
            }).catch((err: HandledError) => {
              alertErrorMessage(err);
            }).finally(() => {
              wx.hideLoading();
            });
          },
          fail() {
            wx.showToast({ title: '拍照失败', icon: 'error' });
          },
        });
      });
    },
    onPreviewPancelChange(e: WechatMiniprogram.CustomEvent<{ visible: boolean, trigger: 'close-btn' | 'overlay' }>) {
      this.setData({
        showPreviewPanel: e.detail.visible,
      });
    },
    closePreview() {
      this.setData({ showPreviewPanel: false });
    },
    chagneCameraDir() {
      const target = this.data.cameraDir === 'front' ? 'back' : 'front';
      this.setData({ cameraDir: target });
    },
    requireCameraPermission() {
      if (this.data.hasPermission) {
        return Promise.resolve();
      }
      return requirePermission('scope.camera').then(() => {
        this.setData({ hasPermission: true });
      });
    },
    onCameraReady() {
      this.setData({ cameraReady: true });
    },
  }
})