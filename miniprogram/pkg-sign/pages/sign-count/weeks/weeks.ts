import dayjs from "dayjs";
import weekOfYear from '../../../../libs/dayjs/plugin/weekOfYear';
import { alertErrorMessage } from "../../../../libs/modal";
import reqContext from "../../../../services/request";
import { getUser } from "../../../../services/user";

dayjs.extend(weekOfYear);
type TOption = { start: number, end: number, label: string };

const EVT_DATE_CHANGED = 'datechanged';

// pkg-sign/pages/sign-count/weeks/weeks.ts
Component({
  options: {
    pureDataPattern: /^_/
  },
  properties: {
    hidden: { type: Boolean, value: false },
    /** @type{'week' | 'month'} */
    mode: { type: String, value: 'week' },
    // 每批次生成多少个选项
    batch: { type: Number, value: 5 }
  },
  data: {
    _init: false,
    _weekEnd: null as null | dayjs.Dayjs,
    ops: [] as TOption[],
    /** 选中项 */
    selectItem: { start: 0, end: 0 },
    /** 要滚动到项的开始毫秒时间 */
    scrollToItem: 0,
    /** 滚动加载防抖时间 */
    _loadmoreTime: 0,
    /** 天数统计 */
    counts: getResetCounts(),
    /** 统计日期列表 */
    countDates: getResetCountDates(),
  },
  observers: {
    hidden(hidden) {
      if (!hidden) {
        if (!this.data._init) {
          this.generateOptions();
        } else {
          this.data.selectItem.start && this.setSelectItem(this.data.selectItem);
        }
      }
    }
  },
  lifetimes: {
    attached() {
      if (!this.data.hidden) {
        this.generateOptions();
      }
    }
  },
  methods: {
    /** 选项开展开 */
    onCountsPanelChanged(e: WechatMiniprogram.CustomEvent<{ value: CountType[] }>) {
      const types = e.detail.value;
      const user = getUser();
      const vm = this;
      if (!types.length || user.isGuest || !vm.data.selectItem.start) return;
      const type = types[types.length - 1];
      if (!vm.data.countDates[type] && vm.data.counts[type] > 0) {
        const fmtYMD = 'YYYY-MM-DD';
        reqContext.useLoading().get<Array<{reportDate?: string, dayTime?: string, qkDate?: string}>>('/api/signinfo/getWeekMonthList', {
          data: {
            jzrybh: user.detail?.sqjzrybh,
            startTime: dayjs(vm.data.selectItem.start).format(fmtYMD),
            endTime: dayjs(vm.data.selectItem.end).format(fmtYMD),
            state: countTypeStateMap[type]
          }
        }).then(list => {
          if (list && list.length) {
            vm.setData({ [`countDates.${type}`]: list.map(e => dayjs(e.reportDate || e.dayTime || e.qkDate).format('M.D')) });
          }
        }, alertErrorMessage);
      }
    },
    /** 加载更多周月选项 */
    loadMoreOptions() {
      const now = Date.now();
      if (now - this.data._loadmoreTime >= 1500) {
        const lastPst = this.data.ops[0].start || 0;
        this.generateOptions();
        this.setData({
          scrollToItem: lastPst,
          _loadmoreTime: now
        });
      }
    },
    // 生成选项时间
    generateOptions() {
      // console.warn('XXXXXXXXXXXXXXXX generateOptions...', this.data.mode, Date.now())
      if (!this.data._init) {
        this.setData({ _init: true });
      }
      const mode = this.data.mode as 'week' | 'month';
      let weekEnd = this.data._weekEnd || dayjs().endOf(mode);
      const list = [];
      for (let i = 0; i < this.data.batch; i++) {
        if (i) {
          weekEnd = weekEnd.subtract(1, mode).endOf(mode);
        }
        const weekStart = weekEnd.startOf(mode);
        list.unshift({
          start: weekStart.valueOf(),
          end: weekEnd.valueOf(),
          // start: weekStart.format('YY-M-D'),
          // end: weekEnd.format('YY-M-D'),
          label: mode === 'week' ? `第${weekStart.week()}周` : weekStart.format('M月')
        });
      }
      this.setData({
        _weekEnd: weekEnd.subtract(1, mode).endOf(mode),
        ops: [...list, ...this.data.ops]
      });
      if (!this.data.selectItem?.start) {
        this.setSelectItem(this.data.ops[this.data.ops.length - 1]);
        this.loadData();
      }
    },
    // 点击选中选项
    onTapToSelect(e: WechatMiniprogram.CustomEvent) {
      const item = {
        start: +e.currentTarget.dataset.start,
        end: +e.currentTarget.dataset.end
      };
      this.setSelectItem(item);
      this.loadData();
    },
    // 设置选中项，并通知页面选中的时间
    setSelectItem(item: Pick<TOption, "start" | "end">) {
      this.setData({ selectItem: item, scrollToItem: item.start });
      this.triggerEvent(EVT_DATE_CHANGED, item);
    },
    // 加载统计数据
    loadData() {
      const vm = this;
      const user = getUser();
      const reset = () => {
        vm.setData({ counts: getResetCounts(), countDates: getResetCountDates() });
      };
      if (user.isGuest || !vm.data.selectItem.start) {
        return reset(); 
      }
      reset();
      reqContext.useLoading().get<ICounts>('/api/signinfo/getWeekMonthCount', {
        data: {
          jzrybh: user.detail?.sqjzrybh,
          startTime: dayjs(vm.data.selectItem.start).format('YYYY-MM-DD'),
          endTime: dayjs(vm.data.selectItem.end).format('YYYY-MM-DD')
        }
      }).then(res => {
        vm.setData({
          counts: {
            normal: res.normalCount,
            missingAllDay: res.notCount,
            missing: res.qkCount,
            cross: res.yjCount,
          }
        });
      }).catch(alertErrorMessage);
    },
  }
})

function getResetCounts(): Record<CountType, number> {
  return {
    /** 正常天数 */
    normal: 0,
    /** 未打卡天数 */
    missingAllDay: 0,
    /** 缺卡 */
    missing: 0,
    /** 越界 */
    cross: 0
  }
}

function getResetCountDates(): Record<CountType, CountDates> {
  return {
    /** 正常 */
    normal: null,
    /** 未打卡 */
    missingAllDay: null,
    /** 缺卡 */
    missing: null,
    /** 越界 */
    cross: null,
  }
}

type CountType = 'normal' | 'missingAllDay' | 'missing' | 'cross';
type CountDates = null | string[];
/** （1-未打卡 2-超时打卡 3-位置异常打卡 4-缺卡 5-正常列表） */
const countTypeStateMap: Record<CountType, number> = {
  /** 正常 */
  normal: 5,
  /** 未打卡 */
  missingAllDay: 1,
  /** 缺卡 */
  missing: 4,
  /** 越界 */
  cross: 3,
}

/**
"xm": "王东", //姓名
"zp": "", //照片
"jgmc": "新都司法局", //机构名称
"notCount": 13, //未打卡天数
"normalCount": 1, //正常天数
"csCount": 1, //超时次数
"yjCount": 0, //越界次数
"qkCount": 2 //缺卡次数
 */
interface ICounts {
  /** 超时次数 */
  csCount: number,
  /** 正常天数 */
  normalCount: number,
  /** 未打卡天数 */
  notCount: number,
  /** 缺卡次数 */
  qkCount: number,
  /** 越界次数 */
  yjCount: number,
}
