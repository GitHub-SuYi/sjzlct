// pages/tab-home/tab-home.ts

import HandledError from "../../libs/error/HandledError";
import reqContext from "../../services/request";
import { checkUserStatus, getUser, userLogin } from "../../services/user";
import { doSignTodayData, getSignTodayData } from "../../services/sign-today";

Component({
  options: {
    pureDataPattern: /^_/
  },
  data: {
    /** 是否已检查用户身份 */
    _checkedSession: false,
    /** 是否是访客用户（未登录） */
    isGuest: true,
    /** 页面名称 */
    pageTitle: '首页',
    /** banner */
    banner: [] as string[],
    /** 签到数据 */
    sign: doSignTodayData(),
  },
  methods: {
    // 启动首页验证用户身份
    onLoad() {
      let pageTitle = '';
      checkUserStatus().then(bindinfo => {
        if (bindinfo.bindUser) {
          return userLogin();
        }
        return Promise.reject(new HandledError('访客用户，未绑定身份证。', true));
      }).then((u) => {
        pageTitle = u.jgmc;
        // 第一次启动时，登录成功后加载数据
        this.loadData();
      }, (_: HandledError) => {
        // 用户身份检查失败：访客（防止抛出错误）
      }).finally(() => {
        const data: AnyObject = { _checkedSession: true };
        if (pageTitle) { data.pageTitle = pageTitle; }
        this.setData(data);
      });
    },
    /*
     * 每次首页显示时：刷新签到信息 和 轮播图
     */
    onShow() {
      // console.log('tab-home instance', this)
      if (this.data._checkedSession) {
        this.loadData();
      }
    },
    onHide() {
      // @ts-ignore
      clearTimeout(this._updateSignTimer);
    },
    loadData(onlyLoadSign = false) {
      const user = getUser();
      if (user.isGuest !== this.data.isGuest) {
        this.setData({ isGuest: user.isGuest });
      }
      if (!user.isGuest) {
        if (user.detail?.jgmc !== this.data.pageTitle) {
          this.setData({ pageTitle: user.detail?.jgmc });
        }
        if (!onlyLoadSign) {
          // 加载轮播图
          reqContext.get<BannerItem[]>('/api/adManagent/getBanner').then(list => {
            if (list && list.length) {
              // this.setData({ banner: list.map(b => ({ adUrl: b.adUrl, id: b.id })) });
              this.setData({ banner: list.map(b => b.adUrl) });
            }
          });
        }
        // 签到信息
        getSignTodayData().then(signData => {
          if (signData.success) {
            this.setData({ sign: signData });
            let finishSign = true;
            if (signData.steps?.length) {
              finishSign = signData.steps[signData.steps.length - 1].done;
            }
            if (!finishSign) {
              // @ts-ignore
              clearTimeout(this._updateSignTimer);
              // @ts-ignore
              this._updateSignTimer = setTimeout(() => this.loadData(true), 60000);
            }
          }
        });
      }
    },
    /** 签到 */
    goSign() {
      this.pageRouter.switchTab({
        url: '/pages/tab-sign/tab-sign'
      });
    },
    /** 主动签到 */
    goSign2() {
      this.pageRouter.navigateTo({
        url: '../../pkg-sign/pages/sign2/sign2'
      });
    },
    /** 查看更多签到统计 */
    goSignCount() {
      this.pageRouter.navigateTo({
        url: '../../pkg-sign/pages/sign-count/sign-count'
      });
    },
    // 公告
    goAnnouncement() {
      this.pageRouter.navigateTo({
        url: '../../pkg-notice/pages/notice-list/notice-list'
      });
    },
    goMessage() {
      this.pageRouter.switchTab({
        url: '../tab-message/tab-message'
      });
    },
    goLogin() {
      this.pageRouter.navigateTo({
        url: '../login/login'
      });
    },
  }
})

interface BannerItem {
  id: number,
  adUrl: string,
  // adName: string,
  // adDesc: string,
  // jgbm: string,
  // adType: number
}
