// pkg-sign/pages/sign-count.ts
// 签到统计

import dayjs from "dayjs";
import { getUser } from "../../../services/user";

type TMode = 'day' | 'week' | 'month';

Component({
  data: {
    // 用户信息
    userAvatar: '',
    userName: '你好，请登录',
    // 日 周 月
    mode: 'day' as TMode,
    // 显示的年份和日期
    year: '',
    date: '',
  },
  methods: {
    onShow() {
      const user = getUser();
      if (!user.isGuest) {
        this.setData({ userAvatar: user.detail?.zp, userName: user.detail?.xm });
      } else {
        this.setData({ userAvatar: '', userName: '你好，请登录' });
      }
    },
    onCountModelChanged(e: WechatMiniprogram.CustomEvent) {
      this.setData({ mode: (e.detail + '') as TMode })
    },
    onDateChanged(e: WechatMiniprogram.CustomEvent<{ start: Date, end?: Date }>) {
      const { start, end } = e.detail;
      if (this.data.mode === 'day') {
        const s = dayjs(start);
        this.setData({
          year: s.year() + '',
          date: s.format('M.D')
        });
      } else {
        const s = dayjs(start);
        const e = dayjs(end);
        const eFormat = e.isSame(s, 'year') ? 'M.D' : 'YYYY.M.D';
        this.setData({
          year: s.year() + '',
          date: s.format('M.D') + ' - ' + e.format(eFormat)
        });
      }
    },
    // 签到规则
    goSignRule() {
      this.pageRouter.navigateTo({
        url: '../sign-rule/sign-rule'
      });
    },
  }
})