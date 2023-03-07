// pages/tab-sign/sign.ts
// 签到组件
// @author YuanYou

import dayjs from "dayjs";
import { off, on } from "../../libs/event";
import { getLocation } from "../../libs/location";
import { getLocationName } from "../../services/location";
import { ISignAddress } from "./types";

/** 签到事件 e.detail: ISignAddress */
const EVT_SIGN = 'sign';
/** 时间（毫秒）更新时间：e.detail: {time:number} */
const EVT_TIME_CHANGE = 'time-changed';

Component({
  options: {
    pureDataPattern: /^_/
  },
  properties: {
    disabled: { type: Boolean, value: false },
    title: { type: String, value: '签到' },
    /** 人脸验证成功的事件 */
    faceEvent: { type: String, value: 'onSignFaceVerifySuccess' }
  },
  data: {
    time: '00:00:00',
    location: { success: false } as ISignAddress,
    _faceFn: null as null | (() => void)
  },
  pageLifetimes: {
    show() {
      // console.log('SIGN instance', this)
      // @ts-ignore
      this._timer = setInterval(() => {
        const now = dayjs();
        this.setData({ time: now.format('HH:mm:ss') });
        this.triggerEvent(EVT_TIME_CHANGE, { time: now.valueOf() });
      }, 1000);
    },
    hide() {
      // @ts-ignore
      clearInterval(this._timer);
    }
  },
  lifetimes: {
    attached() {
      this.data._faceFn = this._getPosition.bind(this);
      on(this.data.faceEvent, this.data._faceFn);
    },
    detached() {
      this.data._faceFn && off(this.data.faceEvent, this.data._faceFn);
    }
  },
  methods: {
    onTapSign() {
      if (this.data.disabled) return;
      // TODO 暂时去掉人脸检测
      // this.pageRouter.navigateTo({
      //   url: '/pages/face/verify-face?event=' + this.data.faceEvent
      // });
      this._getPosition();
    },
    _getPosition() {
      getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 5000,
        showLoading: { title: '获取位置中', mask: true },
        addressResolver: (pst) => getLocationName(pst),
      }).then(res => {
        const evtDetail: ISignAddress = {
          lat: res.latitude,
          lng: res.longitude,
          address: res.address || '',
          success: true
        };
        this.setData({ location: evtDetail });
      }).finally(() => {
        this.triggerEvent(EVT_SIGN, this.data.location);
      });
    },
  }
})
