import dayjs from 'dayjs'
import Pagination from '../../../libs/Pagination';
import reqContext from '../../../services/request';
import { getUser } from '../../../services/user';

let pagination: Pagination | null;

Component({
  data: {
    monthFormat: 'YYYY-MM',
    monthVisible: false,
    monthText: '',
    maxMonth: 0,
    minMonth: 0,
    /** 当月累计总签到数 */
    total: 0,
    list: [] as ISign2Record[],
  },
  methods: {
    onLoad() {
      const vm = this;
      const user = getUser();
      const maxMonth = dayjs().format(vm.data.monthFormat);
      const data: AnyObject = { maxMonth, monthText: maxMonth };
      if (!user.isGuest) {
        data.minMonth = dayjs(user.detail?.sqjzksrq).format(vm.data.monthFormat);
        vm.setData(data);
        pagination = new Pagination();
        pagination.loader = vm._pageLoader.bind(vm);
      } else {
        vm.setData(data);
      }
    },
    onUnload() {
      pagination = null;
    },
    onPullDownRefresh() {
      this.loadPage1().finally(() => {
        wx.stopPullDownRefresh();
      });
    },
    onReachBottom() {
      if (!getUser().isGuest) {
        pagination!.load().catch((err: HandledError) => {
          !err.handled && wx.showModal({ content: err.errMsg });
        });
      }
    },
    loadPage1() {
      const user = getUser();
      if (user.isGuest) {
        wx.showToast({ title: '请先登录', icon: 'error' });
        return Promise.reject('未登录。');
      } else {
        return pagination!.setPageIndex(1).load();
      }
    },
    _pageLoader(data: AnyObject) {
      const vm = this;
      data.searchDate = vm.data.monthText;
      return reqContext.useLoading().get<{ count: number, signList: ISign2Record[]  }>('/api/activeSign/getList', { data })
      .then(res => {
        const list = res.signList || [];
        list.forEach(e => {
          e.signTime = dayjs(e.createTime).format('YYYY-MM-DD HH:mm:ss');
        });
        if (pagination!.isFirstPage) {
          vm.setData({ list });
        } else {
          vm.setData({ list: [...vm.data.list, ...list] });
        }
        return { total: res.count, currentSize: list.length };
      });
    },
    // 打开时间选择器
    showPicker() {
      this.setData({ monthVisible: true });
    },
    // 关闭时间选择器
    closePicker() {
      this.setData({ monthVisible: false });
    },
    // 选择月份后加载数据，滚动到页面顶部
    onSelectMonth(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        monthText: e.detail.value,
        monthVisible: false
      });
      this.loadPage1().then(() => {
        pagination!.scrollToTop();
      });
    }
  }
})

/**
 * address: null
  addressType: 0
  createTime: "2022-09-02T08:55:53.023"
  id: 10
  jgbm: "130102030001010001"
  jzrybh: "1301022022080001"
  latitude: 30.64242
  longitude: 104.04311
  remark: "无法打卡"
  rownumber: 1
  signDate: "2022-09-02T00:00:00"
  signTime: "08:55:53"
 */
interface ISign2Record {
  rownumber: number;
  id: number;
  jzrybh: string;
  signDate: string;
  signTime: string;
  longitude: number;
  latitude: number;
  address: string;
  jgbm: string;
  remark: string;
  createTime: string;
}
