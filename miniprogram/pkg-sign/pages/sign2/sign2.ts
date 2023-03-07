import { ISignAddress } from "../../../components/sign/types";
import { getUser } from "../../../services/user";
import { getMyPolygon, isInPolygon } from "../../../services/polygon";
import dayjs from "dayjs";
import reqContext from "../../../services/request";

// pkg-sign/pages/sign2/sign2.ts
Component({
  options: {
    pureDataPattern: /^_/
  },
  data: {
    // 用户信息
    userAvatar: '',
    userName: '你好，请登录',
    // 是否启用签到按钮
    enableSign: false,
    // 签到备注
    remark: '',
    // 上次签到时间，20秒内不允许再签到
    _lastPostTime: 0,
  },
  methods: {
    onShow() {
      const vm = this;
      const user = getUser();
      if (!user.isGuest) {
        vm.setData({ enableSign: true, userAvatar: user.detail?.zp, userName: user.detail?.xm });
      } else {
        vm.setData({ enableSign: false, userAvatar: '', userName: '你好，请登录' });
      }
    },
    // 时间变化后，判断距离上次打卡是否有20秒，以此决定签到按钮是否启用
    onTimeChanged(e: WechatMiniprogram.CustomEvent<{ time: number }>) {
      if (!this.data.enableSign && !getUser().isGuest && e.detail.time - this.data._lastPostTime > 20000) {
        this.setData({ enableSign: true });
      }
    },
    // 点击签到
    onTapSign(e: WechatMiniprogram.CustomEvent<ISignAddress>) {
      const vm = this;
      const remark = vm.data.remark.trim();
      if (!remark) {
        return wx.showModal({ content: '选择预设的签到备注或自行填写。', success(){} });
      }
      const addr = e.detail;
      if (addr.success) {
        getMyPolygon().then(polygons => {
          let addressType: 0 | 1 = 0; // 位置类型（0-正常 1-越界）
          const { 0: signDate, 1: signTime } = dayjs().format('YYYY-MM-DD HH:mm:ss').split(' ');
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
          reqContext.useLoading().post('/api/activeSign/add', {
            signDate, signTime,
            longitude: addr.lng,
            latitude: addr.lat,
            address: addr.address,
            addressType,
            remark
          }).then(() => {
            vm.setData({ remark: '', _lastPostTime: Date.now(), enableSign: false });
            wx.showToast({ title: '签到成功', icon: 'success' });
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
    // 点击备注预设
    setPresetRemark(e: WechatMiniprogram.CustomEvent) {
      this.setData({ remark: e.currentTarget.dataset.text });
    },
    // 主动签到统计
    goSignCount() {
      this.pageRouter.navigateTo({
        url: '../sign2-count/sign2-count'
      })
    },
  }
})