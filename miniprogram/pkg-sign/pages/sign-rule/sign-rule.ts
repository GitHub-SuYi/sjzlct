// pkg-sign/pages/sign-rule/sign-rule.ts
// 签到规则

import reqContext from "../../../services/request"
import { getUser } from "../../../services/user";

Component({
  data: {
    ruleConten: ''
  },
  methods: {
    onLoad() {
      if (!getUser().isGuest) {
        reqContext.get<{ ruleDesc?: string }>('/api/affirmativePlan/getRuleDesc').then(res => {
          if (!res || !res.ruleDesc) {
            wx.showToast({ title: '还没有签到规则说明', icon: 'none' });
          } else {
            this.setData({ ruleConten: res.ruleDesc });
          }
        }).catch(() => {
          wx.showToast({ title: '加载失败', icon: 'error' });
        });
      } else {
        wx.showToast({ title: '登录后查看' });
      }
    },
  }
})