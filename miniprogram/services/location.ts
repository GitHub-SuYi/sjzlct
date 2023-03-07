// --------------------------------------------
// 定位服务。
// @author: YuanYou
// --------------------------------------------
import dayjs from "dayjs";
import config from "../libs/config";
import { getLocation, ILocationPostion } from "../libs/location";
import reqContext from "./request";
import { getUser } from "./user";
import { IMessageOfControl } from "./IM";

/** 用于处理IM的位置控制消息的逻辑。 */
export function handleIMControl(cmd: IMessageOfControl) {
  if (cmd.ctype == 1) {
    config.isDev && console.log('[location] 接收到控制命令，立即上传定位。', cmd);
    locationService.uploadLocation();
  } else if (cmd.ctype == 2) {
    config.isDev && console.log('[location] 接收到控制命令，更新定位频率。', cmd);
    locationService.setRefreshTime(cmd.rate * 60000);
    const user = getUser();
    if (!user.isGuest && user.detail) {
      user.detail.refreshTime = cmd.rate;
      user.storeDetail();
    }
  }
}

/** 位置上传服务。 */
class LocationService {
  /** 定位刷新周期（毫秒），默认10分钟。 */
  private refreshTime = 600000;
  /** 定位上传定时器。 */
  private timer?: number;
  // constructor() {
  //   const t = Number(getUser().detail?.refreshTime);
  //   if (t && t > 0) {
  //     this.refreshTime = t;
  //   }
  // }

  /** 设置并更新定位上传周期（毫秒）。 */
  public setRefreshTime(ms: number | string): LocationService {
    const t = +ms;
    if (t && t > 0) {
      this.refreshTime = t;
      // 仅当有上传任务时才更新并重启任务
      if (typeof this.timer === 'number') {
        this.start();
      }
    }
    // else {
    //   throw new HandledError('[LocationService] setRefreshTime参数无效：' + ms);
    // }
    return this;
  }

  /** 获取定位上传周期（毫秒）。 */
  public getRefreshTime() {
    return this.refreshTime;
  }

  /** 清除上次的上传任务，并开始一个新的上传任务。 */
  public start() {
    const task = () => this.uploadLocation();
    task();
    this.close();
    this.timer = setInterval(task, this.refreshTime);
    config.isDev && console.log('[LocationService] 定位服务已启动，定位周期：', this.refreshTime);
  }

  /** 关闭位置上传服务。 */
  public close() {
    let _t;
    if (typeof (_t = this.timer) === 'number') {
      clearInterval(_t);
      this.timer = undefined;
      config.isDev && console.log('[LocationService] 定位服务已关闭：', _t);
    } else {
      config.isDev && console.warn('[LocationService] 定位服务在关闭时未找到任务：', _t);
    }
  }

  /** 获取定位信息并上传。 */
  public uploadLocation() {
    return getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 10000,
      addressResolver: (pst) => getLocationName(pst),
    }).then(pst => {
      return wx.getNetworkType().then((res) => res.networkType, () => '').then((network) => {
        const user = getUser();
        return reqContext.post<void>('/api/uploadLocation', {
          deviceId: user.openid,
          lng: pst.longitude,
          lat: pst.latitude,
          address: pst.address!,
          reportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          locationModel: 2,
          network,
          accuracy: pst.accuracy,
          supplier: 13
        }).catch(err => {
          config.isDev && console.error('[LocationService] 位置上传失败。', err);
          throw err;
        });
      });
    }).catch(err => {
      config.isDev && console.error('[LocationService] 获取位置失败。', err);
      throw err;
    });
  }
}
/** 获取位置上传服务。 */
const locationService = new LocationService();
export { locationService };

/** TODO 逆地理位置解析。 */
export function getLocationName(position: ILocationPostion): Promise<string> {
  return Promise.resolve('');
}