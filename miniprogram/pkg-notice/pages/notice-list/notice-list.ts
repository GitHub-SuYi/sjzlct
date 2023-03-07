import dayjs from "dayjs";
import Pagination from "../../../libs/Pagination";
import { queryString } from "../../../libs/query-string";
import reqContext from "../../../services/request";
import { getUser } from "../../../services/user";


let pagination: Pagination | null;

Component({
  data: {
    searchName: '',
    list: [] as INotice[]
  },
  methods: {
    onLoad() {
      const vm = this;
      const user = getUser();
      if (!user.isGuest) {
        pagination = new Pagination();
        pagination.loader = vm._pageLoader.bind(vm);
      }
    },
    onUnload() {
      pagination = null;
    },
    onReachBottom() {
      if (!getUser().isGuest) {
        pagination!.load().catch((err: HandledError) => {
          !err.handled && wx.showModal({ content: err.errMsg });
        });
      }
    },
    doSearch(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ searchName: e.detail.value });
      if (!getUser().isGuest) {
        pagination!.setPageIndex(1).load().catch((err: HandledError) => {
          !err.handled && wx.showModal({ content: err.errMsg });
        });
      } else {
        wx.showToast({ title: '请先登录', icon: 'error' });
      }
    },
    _pageLoader(data: AnyObject) {
      const vm = this;
      data.searchName = vm.data.searchName;
      data.type = 2; // 查询类型1-系统通知、2-公告、3-活动
      data.orderby = 'desc';
      return reqContext.useLoading().get<INotice[]>('/api/msgNotice/noticeList', { data })
      .then(res => {
        const list = res || [];
        list.forEach(e => {
          e.pubTime = dayjs(e.pubTime).format('YYYY-MM-DD HH:mm');
        });
        if (pagination!.isFirstPage) {
          vm.setData({ list });
        } else {
          vm.setData({ list: [...vm.data.list, ...list] });
        }
        return { currentSize: list.length };
      });
    },
    // @ts-ignore
    goNoticeDetail(e: WechatMiniprogram.CustomEvent) {
      const i = e.currentTarget.dataset.index;
      const notice = this.data.list[i];
      if (!notice) return wx.showToast({ title: '参数错误', icon: 'error' });
      this.pageRouter.navigateTo({
        url: queryString('../notice-detail/notice-detail', {
          id: notice.id,
          title: notice.title,
          jgmc: notice.jgmc,
          time: notice.pubTime,
        })
      });
    },
  }
})

/**
 * id: 2
  jgbm: "130102030001010001"
  jgmc: "非羁押人员管控"
  lookCompany: ",,,130102030001010001,,,"
  lookCount: 0
  pubTime: "2022-07-21T16:55:27.637"
  rownumber: 1
  soft: 50
  title: "123"
 */
interface INotice {
  id: number;
  jgbm: string;
  jgmc: string;
  lookCompany: string;
  lookCount: number;
  pubTime: string;
  rownumber: number;
  soft: number;
  title: string;
}
