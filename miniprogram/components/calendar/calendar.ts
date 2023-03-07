import dayjs from "dayjs";
import { ComponentWithComputed } from "miniprogram-computed";
import localeData from '../../libs/dayjs/plugin/localeData';

dayjs.extend(localeData);

/** 事件：选择日期改变 */
const EVT_DATE_CHANGED = 'changed';
/** 事件：月份（视图）改变 */
const EVT_MONTH_CHANGED = 'month-changed';
/** 事件：创建日历中每个日期时 */
const EVT_DATE_CREATE = 'date-create';

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/
  },
  // 外部类名：日历容器，日期，被选中日期，周末日期
  externalClasses: ['classes', 'day-class', 'day-selected-class', 'day-weekend-class', 'day-disabled-class'],
  properties: {
    hidden: { type: Boolean, value: false },
    /** 是否显示日历工具栏 */
    showHeader: { type: Boolean, value: true },
    /** 是否显示其他月份日期 */
    showOtherDate: { type: Boolean, value: true },
    /** 默认日期（`format`指定格式的日期字符串或时间戳），不设置默认当前 */
    date: { type: String, optionalTypes: [Number], value: '' },
    /** 日期格式，如果 `date` 是字符串的话，其也需要符合该格式，否则无法正确解析 */
    format: { type: String, value: 'YYYY-MM-DD' },
    /** 头部工具栏显示月份日期格式，不设置默认根据语言变更 */
    headerMonthFormat: { type: String, value: '' },
    /** 切换月份时，是否保持日期不变 */
    keepDate: { type: Boolean, value: false },
    /** 日期额外信息定义，详见：`CalendarExtra` 类型定义 */
    extra: Object ,
    /** 日期额外信息定义中默认的类型为 'dot'，详见：ExtraType 类型定义 */
    extraType: { type: String, value: 'dot' },
    /** 日期额外信息定义中默认的 `dotColor` 为 '#1890ff'，详见：`CalendarExtra` 类型定义 */
    extraDotColor: { type: String, value: '#1890ff' },
  },
  data: {
    _init: false,
    _weekdayOffsets: {} as Record<number, number>,
    _renderMonth: null as null | Date,
    // 日历星期名称
    weekdayNames: [] as string[],
    // 当前选择日期
    value: null as null | Date,
    // 当前选择日期时间戳
    timestamp: 0,
    // 当前月份渲染数据
    cells: [] as CalendarDay[][],
    // 当前月份显示名称
    headerMonth: '',
    // 日期额外信息（转换后）
    extraInfo: {} as CalendarExtra
  },
  watch: {
    // 外部传入的日期变化时，更新
    date(date) {
      wx.nextTick(() => {
        const d = this.getDayjsObj(date);
        const dateChanged = d.valueOf() !== this.data.timestamp;
        if (dateChanged) {
          this.setData({ value: d.toDate() });
          if (!d.isSame(this.data._renderMonth, 'month')) {
            this.generateDays(d);
          }
        }
      });
    },
    // 选中日期变化时，同步时间戳
    value(date: Date) {
      let ms = 0;
      const evtArg = { date, dateFormated: '' };
      if (date) {
        ms = date.valueOf();
        evtArg.dateFormated = dayjs(date).format(this.data.format);
      }
      if (ms !== this.data.timestamp) {
        this.triggerEvent(EVT_DATE_CHANGED, evtArg)
        this.setData({ timestamp: ms });
      }
    },
    // 渲染月份改变时，设置Header
    _renderMonth(date: Date) {
      let fmt = this.data.headerMonthFormat;
      if (!fmt) {
        const lang = dayjs.locale().split(/[-_]/g)[0].toLowerCase();
        fmt = lang === 'zh' ? 'YYYY年M月' : 'MMM, YYYY';
      }
      this.setData({ headerMonth: dayjs(date).format(fmt) });
      this.triggerEvent(EVT_MONTH_CHANGED, { month: date });
    },
    // 初次显示时初始化组件
    hidden(h) {
      // console.warn('observer hidden', h)
      if (!h && !this.data._init) {
        this.init();
      }
    },
    // 日期额外信息变更，同步设置
    extra(extra: CalendarExtra) {
      let dates: string[] = [];
      if ((!extra) || (dates = Object.keys(extra)).length === 0) {
        return this.setData({ extraInfo: {} });
      }
      const resolved = { ...this.data.extraInfo };
      dates.forEach(date => {
        const def = extra[date];
        const dateStrOrNum = /^[0-9]\d{11}[0-9]$/.test(date) ? +date : date;
        const extraKey = this.getDayjsObj(dateStrOrNum).valueOf();
        const _: CalendarExtraInfo = resolved[extraKey] = {
          type: def.type || this.data.extraType,
          style: def.style || ''
        };
        if (_.type === 'text') {
          _.text = def.text;
        } else if (_.type === 'dot') {
          const dotColor = def.dotColor || this.data.extraDotColor;
          if (dotColor) {
            _.style += (_.style ? ';' : '') + 'background-color:' + dotColor;
          }
        }
      });
      this.setData({ extraInfo: resolved });
    }
  },
  lifetimes: {
    attached() {
      if (!this.data.hidden && !this.data._init) {
        this.init();
      }
    }
  },
  methods: {
    onTapDate(e: WechatMiniprogram.CustomEvent) {
      const { weekIndex, dayIndex, disabled } = e.currentTarget.dataset;
      if (+disabled) return;
      const day: CalendarDay = this.data.cells[weekIndex][dayIndex];
      if (day && day.isCurrentMonth) {
        this.setData({ value: day.dayjs?.toDate() });
      }
    },
    changeMonth(e: WechatMiniprogram.CustomEvent) {
      const offset = +e.currentTarget.dataset.offset;
      const _renderMonth = dayjs(this.data._renderMonth).add(offset, 'month').toDate();
      if (this.data.keepDate && this.data.value) {
        this.setData({
          value: dayjs(this.data.value).add(offset, 'month').toDate()
        });
      }
      this.generateDays(_renderMonth);
    },
    init() {
      // console.warn('init calendar....');
      // 初始化：星期排列（顺序）
      const weekdayNames = dayjs.weekdaysMin().slice(0);
      const weekdayOffsets: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
      const week1stDayIdx = dayjs.localeData().firstDayOfWeek();
      if (week1stDayIdx !== 0) {
        const removedWeekdays = weekdayNames.splice(0, week1stDayIdx);
        const removedCount = removedWeekdays.length;
        let _maxOffset = 0;
        for (let i = removedCount; i < 7; i++) {
          _maxOffset = (weekdayOffsets[i] -= removedCount);
        }
        removedWeekdays.forEach((_, i) => {
          weekdayOffsets[i] = (++_maxOffset);
        });
        weekdayNames.push(...removedWeekdays);
      }
      // 初始化：选择日期
      const selectedDay = this.getDayjsObj(this.data.date);

      this.setData({
        weekdayNames,
        value: selectedDay.toDate(),
        _weekdayOffsets: weekdayOffsets,
        _init: true
      });
      this.generateDays(selectedDay);
    },
    generateDays(month: dayjs.Dayjs | Date) {
      const mth = dayjs(month);
      const firstDay = mth.startOf('month');
      const lastDay = mth.endOf('month');
      const selectedMonthDays = lastDay.date();
      const weekdayOffsetOf1st = this.data._weekdayOffsets[firstDay.day()];
      const weekdayOffsetOfLast = this.data._weekdayOffsets[lastDay.day()];
      const cells: number[] = new Array(weekdayOffsetOf1st).fill(-1)
        .concat(new Array(selectedMonthDays).fill(0))
        .concat(new Array(6 - weekdayOffsetOfLast).fill(1));
      const weeks:CalendarDay[][] = [];
      let crtDay = firstDay.clone();
      cells.forEach((flag, i) => {
        if (i % 7 === 0) {
          weeks.push([]);
        }
        const isCurrentMonth = flag === 0;
        const weekDays = weeks[weeks.length - 1];
        const weekDaysItem: CalendarDay = { isCurrentMonth }
        if (isCurrentMonth) {
          weekDaysItem.dayjs = crtDay;
          weekDaysItem.date = crtDay.date();
          weekDaysItem.timestamp = crtDay.valueOf();
          weekDaysItem.day = crtDay.day();
          weekDaysItem.disabled = false;
          this.triggerEvent(EVT_DATE_CREATE, weekDaysItem);
          crtDay = crtDay.add(1, 'day');
        }
        weekDays.push(weekDaysItem);
      });
      this.setData({ cells: weeks, _renderMonth: firstDay.toDate() });
      // console.log(this.data.cells)
    },
    getDayjsObj(date?: Date | string | number, format?: string) {
      let d: dayjs.Dayjs;
      if (arguments.length > 0) {
        const dayjsArgs: [any?, string?] = [];
        if (date !== '' && date !== null) {
          dayjsArgs.push(date);
          if (typeof date === 'string') {
            dayjsArgs.push(format || this.data.format);
          }
        }
        d = dayjs.apply(null, dayjsArgs)
      } else {
        d = dayjs();
      }
      if (!d.isValid()) {
        const error = '错误的日期格式。';
        console.error(error, date);
        throw new TypeError(error);
      }
      return d.hour(0).minute(0).second(0).millisecond(0);
    },
  }
})

export interface CalendarDay {
  /** 是否是渲染月份的日期 */
  isCurrentMonth: boolean,
  /** dayjs对象 */
  dayjs?: dayjs.Dayjs,
  /** 日期（1-31） */
  date?: string | number,
  /** 周星期（0-6） */
  day?: number,
  /** 日期对应的时间戳（毫秒） */
  timestamp?: number,
  /** 是否禁用当前日期 */
  disabled?: boolean
}

export interface CalendarExtra {
  [timestamp: number]: CalendarExtraInfo,
  [date: string]: CalendarExtraInfo
}
interface CalendarExtraInfo {
  type?: CalendarExtraType,
  dotColor?: string,
  text?: string,
  style?: string
}

type CalendarExtraType = 'dot' | 'text';
