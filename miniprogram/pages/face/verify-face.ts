import { requirePermission } from "../../libs/authorize";
import { emit } from "../../libs/event";
import { alertErrorMessage } from "../../libs/modal";
import { queueMicrotask } from "../../libs/task";
import { matchFace } from "../../services/face";

// pages/face/verify-face.ts
Component({
  options: {
    pureDataPattern: /^_/,
  },
  properties: {
    /** 人脸验证成功时触发的事件。 */
    event: { type: String }
  },
  data: {
    _hasPermission: false,
    cameraDir: 'front' as 'front' | 'back',
    /** 相机是否准备好 */
    cameraReady: false,
    /** 是否启用重试按钮 */
    enableRetry: false,
    /** 是否显示倒计时以及倒计时时间 */
    showCountdown: false,
    countdown: 3,
  },
  methods: {
    onLoad() {
      if (!this.data.event) {
        wx.showModal({ content: '参数错误，缺少URL参数“event”。' });
      }
    },
    onReady() {
      this.requireCameraPermission().then(() => {
        this.retry();
      });
    },
    verifyFace() {
      const vm = this;
      const camera = wx.createCameraContext();
      const hl = () => {
        wx.hideLoading();
        vm.setData({ enableRetry: true });
      };
      wx.showLoading({ title: '验证中', mask: true });
      camera.takePhoto({
        quality: 'normal',
        success(res) {
          matchFace(res.tempImagePath).then(() => {
            wx.showToast({ title: '验证成功', icon: 'success' });
            setTimeout(() => {
              emit(vm.data.event);
              vm.pageRouter.navigateBack();
            }, 1000);
          }).catch((err: HandledError) => {
            alertErrorMessage(err, { title: '验证失败' });
          }).finally(hl);
        },
        fail() {
          hl();
          wx.showToast({ title: '获取图像失败', icon: 'error' });
        },
      });
    },
    retry() {
      const vm = this;
      vm.setData({ countdown: 3, showCountdown: true, enableRetry: false });
      const timer = setInterval(() => {
        const countdown = vm.data.countdown - 1;
        const dataToSet: AnyObject = { countdown };
        if (countdown <= 0) {
          dataToSet.showCountdown = false;
          clearInterval(timer);
          queueMicrotask(() => {
            vm.verifyFace();
          });
        }
        vm.setData(dataToSet);
      }, 1000);
    },
    chagneCameraDir() {
      const target = this.data.cameraDir === 'front' ? 'back' : 'front';
      this.setData({ cameraDir: target });
    },
    requireCameraPermission() {
      if (this.data._hasPermission) {
        return Promise.resolve();
      }
      return requirePermission('scope.camera').then(() => {
        this.setData({ _hasPermission: true });
      });
    },
    onCameraReady() {
      this.setData({ cameraReady: true });
    },
  }
})