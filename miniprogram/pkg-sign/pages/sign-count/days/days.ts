// import dayjs from "dayjs";

import dayjs from "dayjs";
import { CalendarDay, CalendarExtra } from "../../../../components/calendar/calendar";
import { alertErrorMessage } from "../../../../libs/modal";
import reqContext from "../../../../services/request";
import { doSignTodayData, ISignServerData } from "../../../../services/sign-today";
import { getUser } from "../../../../services/user";

const EVT_DATE_CHANGED = 'datechanged';

Component({
  options: {
    pureDataPattern: /^_/
  },
  properties: {
    hidden: { type: Boolean, value: false }
  },
  data: {
    // 是否初始化过
    _init: false,
    // 当前选中的日期
    _date: null as null | Date,
    // 日历标注信息
    calendarExtra: {} as CalendarExtra,
    // 签到步骤列表
    sign: doSignTodayData(),
    // signStepIndex: 0,
    // 正常打卡次数
    normal: 0,
    // 缺卡次数
    missing: 0,
    // 越界次数
    cross: 0,
  },
  observers: {
    hidden(hidden) {
      if (!hidden && this.data._init && this.data._date) {
        this.triggerEvent(EVT_DATE_CHANGED, { start: this.data._date });
      }
    }
  },
  methods: {
    /** 选择日期，加载数据 */
    onSelectDate(e: WechatMiniprogram.CustomEvent<{ date: Date, dateFormated: string }>) {
      this.setData({ _date: e.detail.date });
      this.triggerEvent(EVT_DATE_CHANGED, { start: e.detail.date });
      this.loadData();
    },
    /** 日历日期创建时，限定可选择范围：矫正范围 */
    onCalendarDateCreating(e: WechatMiniprogram.CustomEvent<CalendarDay>) {
      const user = getUser();
      if (user.isGuest) return;
      const userDetail = user.detail;
      if (userDetail?.sqjzksrq && userDetail.sqjzjsrq) {
        e.detail.disabled = e.detail.dayjs?.isBefore(userDetail.sqjzksrq) || e.detail.dayjs?.isAfter(userDetail.sqjzjsrq);
      }
    },
    /** 月份切换后，加载月统计 */
    onCalendarMonthChanged(e: WechatMiniprogram.CustomEvent<{ month: Date }>) {
      const vm = this;
      const user = getUser();
      if (user.isGuest) return;
      reqContext.get<IMonthCount[]>('/api/signinfo/getCalendarState', {
        data: { jzrybh: user.detail?.sqjzrybh, searchDate: dayjs(e.detail.month).format('YYYY-MM') }
      }).then(list => {
        if (!list || !list.length) return;
        const calendarExtra: CalendarExtra = {};
        const limitTimeBegin = dayjs(user.detail?.sqjzksrq);
        let limitTimeEnd = dayjs(user.detail?.sqjzjsrq);
        const today = dayjs();
        if (limitTimeEnd.isAfter(today)) {
          limitTimeEnd = today.add(1, 'day').hour(0).minute(0).second(0).millisecond(0);
        }
        list.forEach(e => {
          const day = dayjs(e.dayTime);
          if ((day.isSame(limitTimeBegin) || day.isAfter(limitTimeBegin)) && day.isBefore(limitTimeEnd)) {
            calendarExtra[day.valueOf()] = {};
            if (e.state !== 1) calendarExtra[day.valueOf()].dotColor = '#ff9700';
          }
        });
        vm.setData({ calendarExtra });
      });
    },
    /** 加载统计数据 */
    loadData() {
      const vm = this;
      const user = getUser();
      if (user.isGuest) return;
      if (!vm.data._init) {
        vm.setData({ _init: true });
      }
      const targetDate = dayjs(vm.data._date);
      // if (targetDate.isAfter(new Date())) {
      //   return vm.setData({ 'sign.success': false });
      // }
      // 加载打卡详情
      const data = {
        jzrybh: user.detail?.sqjzrybh,
        searchDate: targetDate.format('YYYY-MM-DD')
      };
      return reqContext.useLoading().get<ISignServerData[]>('/api/signinfo/getAttendanceList', { data })
      .then(list => {
        const renderData = doSignTodayData(list, false, targetDate);
        if (!renderData.success) throw new Error('签到数据加载失败。');
        // let signStepIndex = renderData.steps.findIndex(e => !e.done);
        // if (signStepIndex === -1) signStepIndex = renderData.steps.length - 1;
        // this.setData({ sign: renderData, signStepIndex });
        let normal = 0, missing = 0, cross = 0;
        renderData.steps.forEach(s => {
          if (s.step === 2) normal++;
          else if (s.step === 3) cross++;
          else if (s.step === 4) missing++;
        });
        this.setData({ sign: renderData, normal, missing, cross });
      })
      .catch((err) => {
        this.setData({ 'sign.success': false });
        alertErrorMessage(err);
      });
    },
  }
})

/**
 * 
"num": 17, //当月号数
"dayTime": "2020-04-17T00:00:00", //日历时间
"totalNum": 10,
"todayNum": 2,
"state": 3, //当天状态（1-正常 2-未打卡 3-缺卡）
"startTime": "2020-04-14T00:00:00", //矫正开始日期
"endTime": "2020-05-08T00:00:00" //矫正结束日期
 */
interface IMonthCount {
  /** 日期，如：2020-04-17T00:00:00 */
  dayTime: string,
  /** 当天状态（1-正常 2-未打卡 3-缺卡） */
  state: number
}
