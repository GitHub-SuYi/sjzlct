import { queryString } from "../../../libs/query-string";
import { ChatType } from "../../../services/IM";

// pkg-message/pages/chat/chat.ts
Component({
  data: {
    msgListBottom: '',
    chatName: '',
    chatPushId: '',
    chatType: 0 as ChatType
  },
  methods: {
    onLoad(p: AnyObject) {
      // chatName, chatPushId, chatType
      const param = queryString.parse<AnyObject>(p);
      param && this.setData(param);
    },
    onMsgTextLineChanged(e: WechatMiniprogram.CustomEvent<ITextareaLineChangedDetail>) {
      // wx.showModal({content: JSON.stringify(e.detail)})
      // 20: textarea.padding, 24: msg-list.padding, 40:msg-tool.padding
      let btm = Math.ceil(e.detail.lineCount === 1 ? 138 : e.detail.heightRpx + 20 + 24 + 40);
      if (btm % 2 !== 0) btm++;
      if (btm < 138) btm = 138;
      // wx.showToast({title: btm+''})
      this.setData({ msgListBottom: `padding-bottom:${btm}rpx;` });
    },
  }
})

interface ITextareaLineChangedDetail {
  height: number
  heightRpx: number
  lineCount: number
  lineHeight: number
}
