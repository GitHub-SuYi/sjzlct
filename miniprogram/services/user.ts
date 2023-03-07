// --------------------------------------------
// 用户服务。
// @author: YuanYou
// --------------------------------------------

import { handleIMControl, locationService } from "../services/location";
import { queueMicrotask } from "../libs/task";
import User, { ServerLoginHandler } from "../libs/user/User";
import { im } from "./IM";
import reqContext from "./request";

let user: User<UserDetail> | null = null;

/**
 * 获取当前用户。
 */
export function getUser() {
  if (!user) {
    user = new User();
  }
  return user;
}

/**
 * 检查微信用户是否绑定到平台。
 */
export function checkUserStatus() {
  const userBindinfo: ServerLoginHandler = (openidOrCode) => reqContext.postJSON('/api/appusers/wxlogin', openidOrCode);
  return getUser().checkSession(userBindinfo);
}

/**
 * 当前用户登录，拉取并返回用户实体详情。
 * @task 登录成功后任务：
 * - a、检查用户是否录入人脸；
 * - b、开启定位推送，默认10分钟1次，WARN：登出后关闭服务；
 * - c、开启IM服务，WARN：登出后关闭服务；
 */
export function userLogin() {
  return getUser().login(openid => {
    const device = wx.getDeviceInfo();
    const userDetailLoader = reqContext.post<UserDetail>('/api/appusers', {
      loginType: 3,
      loginModel: 4,
      model: device.model,
      vendor: device.brand,
      uuid: openid,
      openid
    });
    userDetailLoader.then((usr) => {
      queueMicrotask(() => {
        // 加载用户详情信息
        reqContext.get<UserDetail[]>('/api/getUserInfo').then(usrInfos => {
          // console.log('/api/getUserInfo', u)
          if (usrInfos?.[0]) {
            const u = usrInfos[0];
            const user = getUser();
            const userDetail = user.detail || {} as UserDetail;
            userDetail.sfzh = u.sfzh;
            userDetail.sqjzrybh = u.sqjzrybh;
            userDetail.grlxdh = u.grlxdh;
            userDetail.sqjzksrq = u.sqjzksrq;
            userDetail.sqjzjsrq = u.sqjzjsrq;
            user.storeDetail(false);
          }
        });
        // a.人脸检查
        if (!usr.faceToken) {
          wx.showModal({
            title: '生物认证',
            content: '检测到你还未录入面部图像，需要采集你的面部图像才能正常使用签到打卡等功能，请确认立即采集或稍后前往个人中心点击【面部图像】采集。',
            showCancel: true,
            cancelText: '下次再说',
          }).then(res => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/face/reg-face' });
            }
          });
        }
        // b.定位服务
        locationService.setRefreshTime((+usr.refreshTime || 0) * 60000).start();
        im.onControl(handleIMControl); // 退出登录时注销监听，防止再次登录时监听逻辑会重复
        // c.加载机构后，作为加入WebSocket的群组
        reqContext.get<UserGroup[]>('/api/msgCompany?status=1').then(groups => {
          if (groups && groups.length) {
            im.addGroup(groups.map(g => g.jgbm));
          }
        });
      });
    });
    return userDetailLoader;
  });
}

/**
 * 用户退出登录，关闭服务。
 * - a、关闭定位服务；
 * - b、关闭IM；
 */
export function userLogout() {
  im.offControl(handleIMControl);
  const imCloser = im.close();
  const locationCloser = locationService.close();
  return Promise.allSettled([imCloser, locationCloser]).then(() => {
    return getUser().logout();
  });
}

/**
 * 用户实体详情。
 */
export interface UserDetail {
  /** 用户鉴权Token，不含`Bearer `前缀*/
  token: string,
  /** 用户自增id */
  uid: string,
  /** 推送id */
  pushId: string,
  /** 人脸图片Base64 */
  faceID: string,
  /** 人脸FaceToken */
  faceToken: string,
  /** 机构名称 */
  jgmc: string,
  /** 机构编码 */
  jgbm: string,
  /** 姓名 */
  xm: string,
  /** 头像 */
  zp: string,
  /** 是否首次登陆（0-是 1-否） */
  isFastLogin: 0 | 1,
  /** 是否常用设备（0-是 1-否） */
  isEquipe: 0 | 1,
  /** 定位刷新时间（单位：分钟） */
  refreshTime: string | number,
  //////// api/getUserInfo /////////
  /** 身份证号 */
  sfzh?: string,
  /** 矫正人员编号 */
  sqjzrybh?: string,
  /** 联系电话 */
  grlxdh?: string,
  /** 矫正开始日期 */
  sqjzksrq?: string,
  /** 矫正结束日期 */
  sqjzjsrq?: string,
}

/**
 * 群组信息。
 * chat_switch: 0
  dz: ""
  dzyx: ""
  jgbm: "130102030001010001"
  jgjc: "fjyrygk"
  jgmc: "非羁押人员管控"
  lxdh: "13514267591"
  yb: ""
 */
interface UserGroup {
  chat_switch: number;
  dz: string;
  dzyx: string;
  jgbm: string;
  jgjc: string;
  jgmc: string;
  lxdh: string;
  yb: string;
}
