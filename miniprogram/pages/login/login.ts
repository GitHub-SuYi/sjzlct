// pages/login/login.ts
// 公共登录页面

import config from "../../libs/config"
import { checkUserStatus, userLogin } from "../../services/user";

Component({
  data: {
    appName: ''
  },
  methods: {
    onLoad() {
      this.setData({
        appName: config.appName
      });
    },
    login() {
      checkUserStatus().then(bindinfo => {
        if (bindinfo.bindUser) {
          userLogin().then((usr) => {
            wx.showToast({ title: '登录成功', icon: 'success' });
            if (usr.faceID) {
              setTimeout(() => {
                this.pageRouter.navigateBack();
              }, 1000);
            }
          }).catch((err: Error) => {
            wx.showModal({
              title: '登录失败',
              content: err.message,
              success(){}
            });
          });
        } else {
          this.pageRouter.redirectTo({
            url: '../bind-idcard/bind-idcard'
          });
        }
      });
    },
    back() {
      this.pageRouter.navigateBack();
    },
  }
})