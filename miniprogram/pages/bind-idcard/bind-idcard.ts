// pages/bind-idcard/bind-idcard.ts

import { alertErrorMessage } from "../../libs/modal";
import { isIdCard } from "../../libs/validation";
import reqContext from "../../services/request";
import { checkUserStatus, getUser, userLogin } from "../../services/user";

// 绑定身份证号码
Component({
  data: {
    idcard: '',
    isIdCard: false
  },
  methods: {
    // @ts-ignore
    bindIdCard() {
      const openid = getUser().openid;
      if (!openid) {
        return wx.showToast({ title: '获取用户失败', icon: 'error' });
      }
      wx.showLoading({ title: '绑定中...', mask: true });
      reqContext.postJSON('/api/appusers/wxBindInfo', {
        idCard: this.data.idcard,
        openId: openid
      }).then(() => {
        wx.showToast({ title: '绑定成功', icon: 'success' });
        return checkUserStatus().then(() => userLogin()).then(() => {
          setTimeout(() => {
            this.pageRouter.navigateBack();
          }, 1000);
        }).catch((err: Error) => {
          alertErrorMessage(err, { title: '登录失败' });
        });
      }, (err: Error) => {
        wx.showModal({
          title: '绑定失败',
          content: '身份证号码绑定失败。消息：' + err.message,
          success(){}
        });
      }).finally(() => {
        wx.hideLoading();
      });
    },
    onIdCardChanged(e: WechatMiniprogram.CustomEvent) {
      // @ts-ignore
      clearTimeout(this._t);
      // @ts-ignore
      this._t = setTimeout(() => {
        const v = (e.detail.value + '').trim();
        this.setData({
          isIdCard: isIdCard(v),
          idcard: v
        });
      }, 400);
    }
  }
})