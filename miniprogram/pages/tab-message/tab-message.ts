// pages/tab-message/tab-message.ts
import reqContext from '../../services/request';
import { ChatType } from '../../services/IM';
import { queryString } from '../../libs/query-string';
// import { uploadFile, UploadFileType } from '../../services/upload';

Component({
  data: {
    chatList: [] as IChatInfo[]
  },
  methods: {
    onLoad() {
      this.loadData();
    },
    onPullDownRefresh() {
      this.loadData().finally(() => {
        wx.stopPullDownRefresh();
      });
    },
    loadData() {
      const vm = this;
      return reqContext.get<IGroupInfo[]>('/api/msgCompany?status=2').then(groups => {
        if (groups && groups.length) {
          const chats = groups.map<IChatInfo>((g) => {
            return {
              type: ChatType.Group,
              name: g.jgmc,
              pushId: g.jgbm,
              avatar: '',
              latestMsg: '　',
              latestMsgTime: '',
            } as IChatInfo;
          });
          vm.setData({ chatList: chats });
        }
      });
    },
    goChat(e: WechatMiniprogram.CustomEvent) {
      const i = +e.currentTarget.dataset.index;
      const chatInfo = this.data.chatList[i];
      if (!chatInfo) return wx.showToast({ title: '参数错误', icon: 'error', success(){} });
      this.pageRouter.navigateTo({
        url: queryString('../../pkg-message/pages/chat/chat', {
          chatName: chatInfo.name,
          chatPushId: chatInfo.pushId,
          chatType: chatInfo.type
        })
      });
    },
    uploadFile() {
      // wx.chooseMedia({}).then(({ tempFiles }) => {
      //   tempFiles.forEach(f => uploadFile(f.tempFilePath, f.fileType === 'image' ? UploadFileType.Image : UploadFileType.Video));
      // });
      // wx.chooseMessageFile({ count: 9, type: 'file' }).then(res => {
      //   res.tempFiles.forEach(f =>
      //     uploadFile(f.path, f.type === 'image' ? UploadFileType.Image : f.type === 'video' ? UploadFileType.Video : UploadFileType.File)
      //   );
      // });
    },
  },
})

/**
 * 机构信息。
 * @example
 * ```json
 * {
  "jgmc": "成都翰东科技有限公司", //机构名称
  "jgbm": "510101010001130010", //机构编码
  "corrNum": 11, //机构人数
  "sendTime": null //最后一条消息时间
 * }
 * ```
 */
interface IGroupInfo {
  corrNum: number;
  jgbm: string;
  jgmc: string;
  sendTime: null | string
}

/** 聊天消息列表项。 */
interface IChatInfo {
  /** 聊天类型，群聊或单聊。 */
  type: ChatType,
  /** 聊天对象名称。 */
  name: string,
  /** 聊天对象的pushid。 */
  pushId: string,
  /** 聊天对象头像。 */
  avatar?: string,
  /** 显示在聊天成员列表的最新消息的预览形式。 */
  latestMsg?: string,
  /** 最新消息的显示时间。 */
  latestMsgTime?: string;
}