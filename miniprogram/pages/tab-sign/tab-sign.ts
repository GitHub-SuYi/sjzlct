// pages/tab-sign/tab-sign.ts
// 签到

import dayjs from "dayjs";
import { ISignAddress } from "../../components/sign/types";
import { getMyPolygon, isInPolygon } from "../../services/polygon";
import reqContext from "../../services/request";
import { getSignTodayData, doSignTodayData, ISignStep } from "../../services/sign-today";
import { getUser } from "../../services/user"

Component({
  options: {
    pureDataPattern: /^_/
  },
  data: {
    // 用户信息
    userAvatar: '',
    userName: '你好，请登录',
    // 签到步骤数据
    sign: doSignTodayData(),
    signStepIndex: 0,
    // 下次打卡时间，有可能是当前正在打卡时间段的结束时间，也有可能是下次打卡时间段的开始时间
    // 当过了这个时间点后刷新页面数据，更新状态
    _next: null as null | ISignStep,
    // 是否启用签到按钮
    enableSign: false
  },
  methods: {
    // 每次进入页面刷新签到进度
    onShow() {
      this.loadData();
    },
    // 时间变化后，当到了下个打卡时间的临界点，刷新页面状态
    onTimeChanged(e: WechatMiniprogram.CustomEvent<{ time: number }>) {
      const nextStep = this.data._next;
      if (nextStep) {
        const nextTime = nextStep.current ? nextStep.end : nextStep.start;
        (e.detail.time > nextTime) && this.loadData();
      }
    },
    onPullDownRefresh() {
      this.loadData().finally(() => {
        wx.stopPullDownRefresh();
      });
    },
    // 加载页面数据
    loadData() {
      const vm = this;
      const user = getUser();
      const resetState = () => {
        vm.setData({ 'sign.success': false, enableSign: false, _next: null, userName: '你好，请登录', userAvatar: '' });
        return Promise.resolve();
      };
      if (!user.isGuest) {
        vm.setData({ userAvatar: user.detail?.zp, userName: user.detail?.xm });
        return getSignTodayData().then(data => {
          if (data.success) {
            const dataToSet = { sign: data, signStepIndex: 0, enableSign: false, _next: null as null | ISignStep }
            dataToSet.signStepIndex = data.steps.findIndex(e => !e.done);
            if (dataToSet.signStepIndex === -1) {
              // 已完成所有打卡
              dataToSet.signStepIndex = data.steps.length - 1;
            } else {
              const nextStep = data.steps[dataToSet.signStepIndex];
              dataToSet._next = nextStep;
              if (nextStep.current) dataToSet.enableSign = true;
            }
            vm.setData(dataToSet);
          } else {
            resetState();
          }
        }, resetState);
      } else {
        return resetState();
      }
    },
    // 点击签到
    onTapSign(e: WechatMiniprogram.CustomEvent<ISignAddress>) {
      const vm = this;
      const addr = e.detail;
      if (addr.success) {
        getMyPolygon().then(polygons => {
          let addressType: 0 | 1 = 0; // 位置类型（0-正常 1-异常）
          const { 0: reportDate, 1: reportTime } = dayjs().format('YYYY-MM-DD HH:mm:ss').split(' ');
          // 记录所有活动电子围栏的活动情况（是否在围栏内）
          const _allowedPolygonState: boolean[] = [];
          for (let i = 0; i < polygons.length; i++) {
            const e = polygons[i];
            const inPolygon = isInPolygon({ latitude: addr.lat, longitude: addr.lng }, e.points);
            if (e.type === 1 && inPolygon) {
              addressType = 1;
              break;
            } else if (e.type === 0) {
              _allowedPolygonState.push(inPolygon);
            }
          }
          // 配置了活动电子围栏时，如果没有在任何一个活动电子围栏内，即时没有进入禁止围栏，也视为越界
          if (addressType === 0 && _allowedPolygonState.length && _allowedPolygonState.indexOf(true) < 0) {
            addressType = 1;
          }
          const user = getUser();
          reqContext.useLoading().post('/api/attendancemange', {
            reportDate, reportTime,
            longitude: addr.lng,
            latitude: addr.lat,
            address: addr.address,
            addressType,
            orgId: vm.data._next?.orgId || 0,
            ruleId: vm.data._next?.id || 0,
            jgbm: user.detail?.jgbm || '',
            personNum: user.detail?.sqjzrybh || '',
            pmId: 0,
            reportType: 0, // 签到类型。0：正常 1：超时打卡
          }).then(() => {
            wx.showToast({ title: '签到成功', icon: 'success' });
            vm.loadData();
          }, (err: Error) => {
            wx.showModal({ title: '签到失败', content: '签到失败。消息：' + err.message, success(){} });
          });
        }).catch((err: Error) => {
          wx.showModal({ title: '签到失败', content: '获取围栏时出现错误。消息：' + err.message, success(){} });
        });
      } else {
        wx.showModal({ title: '签到失败', content: '获取位置信息失败。', success(){} });
      }
    },
    // 签到统计
    goSignCount() {
      this.pageRouter.navigateTo({
        url: '../../pkg-sign/pages/sign-count/sign-count'
      });
    },
    // 签到规则
    goSignRule() {
      this.pageRouter.navigateTo({
        url: '../../pkg-sign/pages/sign-rule/sign-rule'
      });
    },
  },
})