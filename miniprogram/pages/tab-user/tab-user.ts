import dayjs from "dayjs";
import { readBase64AsImage } from "../../libs/bdface/index";
import { alertErrorMessage } from "../../libs/modal";
import { getUser, userLogout } from "../../services/user";

Component({
  data: {
    userinfo: getResetUserinfo(),
  },
  methods: {
    // loadImg() {
    //   this.pageRouter.navigateTo({url:'../face/reg-face'})
    // },
    // 每次进入页面刷新数据
    onShow() {
      const vm = this;
      const user = getUser();
      if (user.isGuest) {
        return vm.setData({ userinfo: getResetUserinfo() });
      }
      const userDetail = user.detail!;
      const _jzFinishDayjs = dayjs(userDetail.sqjzjsrq);
      const userinfo = {
        isGuest: false,
        jzbh: userDetail.sqjzrybh!,
        sfzh: userDetail.sfzh!,
        jgmc: userDetail.jgmc!,
        avatar: userDetail.zp,
        xm: userDetail.xm,
        jzDays: dayjs().diff(userDetail.sqjzksrq, 'day'),
        jzFinishDate: _jzFinishDayjs.format('YYYY.M.D'),
        jzPercent: 0
      };
      (userinfo.jzDays < 0) && (userinfo.jzDays = 0);
      userinfo.jzPercent = Math.round(userinfo.jzDays / _jzFinishDayjs.diff(userDetail.sqjzksrq));
      (userinfo.jzPercent <= 0) && (userinfo.jzPercent = 1);
      vm.setData({ userinfo });
    },
    // onLoad() {
    //   im.onAddGroup((res) => { console.log('tab-user 加组', res) })
    //   im.onRemoveGroup((res) => { console.log('tab-user 退组', res) })
    //   im.onChat(msg => { console.log('tab-user 聊天消息', msg) })
    // },
    /**
     * 退出登录。
     */
    logout() {
      const vm = this;
      wx.showModal({
        title: '退出登录',
        content: '是否确认立即退出登录？',
        showCancel: true,
        confirmText: '确认退出',
        success(res) {
          res.confirm && userLogout().then(() => {
            wx.showToast({ title: '退出成功', icon: 'success' });
            vm.setData({ userinfo: getResetUserinfo() });
          }).catch(() => {
            wx.showToast({ title: '操作失败', icon: 'error' });
          });
        }
      });
    },
    // 预览面部图像
    lookFaceImg() {
      if (this.data.userinfo.isGuest) {
        wx.showToast({ title: '请先登录' });
      } else {
        const faceBase64 = getUser().detail?.faceID;
        if (!faceBase64 || !getUser().detail?.faceToken) {
          return this.pageRouter.navigateTo({ url: '../face/reg-face', success(){} });
          // return this.pageRouter.navigateTo({ url: '../face/verify-face', success(){} });
        }
        readBase64AsImage(faceBase64).then(path => {
          wx.previewImage({
            urls: [path],
            fail(err) { alertErrorMessage(err, { title: '预览失败' }); }
          });
        });
      }
    },
    checkVersion() {
      wx.showToast({ title: '已是最新版本', icon: 'success' });
    },
    // 跳转到关于我们页面
    goAboutUs() {
      this.pageRouter.navigateTo({
        url: '../about-us/about-us'
      });
    },
    // 登录
    goLogin() {
      this.pageRouter.navigateTo({
        url: '../login/login'
      });
    },
  }
})

function getResetUserinfo() {
  return {
    isGuest: true,
    jzbh: '登录后查看',
    sfzh: '登录后查看',
    jgmc: '登录后查看',
    avatar: '',
    xm: '未登录',
    jzDays: 0,
    jzFinishDate: '',
    jzPercent: 0
  };
}