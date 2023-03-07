// 今日签到：数据处理

import dayjs from "dayjs";
import duration from '../libs/dayjs/plugin/duration';
import customParseFormat from '../libs/dayjs/plugin/customParseFormat';
import reqContext from "./request";

dayjs.extend(duration);
dayjs.extend(customParseFormat);

/** 获取今日的签到数据（规则+已签到） */
export function getSignTodayData(): Promise<SignRenderData>;
export function getSignTodayData(format: true): Promise<SignRenderData>;
export function getSignTodayData(format: false): Promise<ISignServerData[]>;
export function getSignTodayData(format = true): Promise<SignRenderData | ISignServerData[]> {
  return reqContext.get<ISignServerData[]>('/api/attendancemange/list').then(list => {
    return format ? doSignTodayData(list) : (list || []);
  });
}

/**
 * 格式化处理服务端签到数据
 * @param list 服务端签到数据列表
 * @param generateTips 是否生成提示文本消息，默认`true`
 * @param today 今日日期，不设置默认当天
 */
export function doSignTodayData(list?: ISignServerData[], generateTips = true, today?: dayjs.Dayjs): SignRenderData {
  const r: SignRenderData = { success: false, steps: [], tips: [] };
  if (!Array.isArray(list) || !list.length) return r;
  const filterList = list.filter(item => item.reportType !== 2);
  if (!filterList.length) return r;
  // 生成进度数据
  const now = Date.now();
  const serverTimeFmt = 'HH:mm:ss';
  const renderTimeFmt = 'HH:mm';
  r.steps = filterList.map(e => {
    const step = getDefaultStep();
    step.orgId = e.orgId;
    step.id = e.id;
    step.address = e.address || '';
    let _startTime = dayjs(e.sTime, serverTimeFmt);
    let _endTime = dayjs(e.endTime || e.eTime, serverTimeFmt);
    if (today && dayjs.isDayjs(today)) {
      _startTime = _startTime.year(today.year()).month(today.month()).date(today.date());
      _endTime = _endTime.year(today.year()).month(today.month()).date(today.date());
    }
    const startTime = _startTime.valueOf();
    const endTime = _endTime.valueOf();
    // console.log(e.sTime, e.endTime || e.eTime, dayjs(e.sTime, serverTimeFmt), dayjs(e.endTime || e.eTime, serverTimeFmt))
    // 显示打卡时间
    step.startMin = dayjs(startTime).format(renderTimeFmt);
    step.endMin = dayjs(endTime).format(renderTimeFmt);
    step.start = startTime;
    step.end = endTime;
    // 打卡状态
    if (e.reportDate && e.reportTime) {
      // 有打卡时间：已打卡
      // 正常 (2)；越界 (3)
      step.step = (e.addressType === 1 ? 3 : 2);
      step.done = true;
    } else {
      // 未到打卡时间 (0)
      // 打卡中 (1)
      // 缺卡 (4)
      if (now < startTime) {
        step.step = 0;
      } else if (now >= startTime && now < endTime) {
        step.step = 1;
      } else {
        step.step = 4;
        step.done = true;
      }
    }
    //  如果已打卡，则显示的时间标签为打卡的时间，而不是规则时间
    if (step.step === 2 || step.step === 3) {
      step.signTime = dayjs(e.reportTime, serverTimeFmt).format(renderTimeFmt);
    }
    // 根据进度确定显示状态及样式
    switch (step.step) {
      case 1:
        step.current = true;
        step.status = 'active';
        step.statusLabel = '打卡中';
        break;
      case 2:
        step.status = 'success';
        step.statusLabel = '已打卡';
        break;
      case 3:
        step.status = 'error';
        step.statusLabel = '越界';
        break;
      case 4:
        step.status = 'error';
        step.statusLabel = '缺卡';
        break;
    }
    return step;
  });
  r.success = true;
  // 生成提示数据
  if (generateTips) {
    // 提示：距离下次打卡时间；或距离本次打卡结束时间
    const crtSignIndex = r.steps.findIndex(item => !item.done);
    if (crtSignIndex >= 0) {
      // 如果当前时间段内还未完成打卡，则提示距离本次结束打卡还有多久；否则提示距离下次打卡时间
      const crtSign = r.steps[crtSignIndex];
      let dur: duration.Duration;
      if (crtSign.step === 0) {
        dur = dayjs.duration(crtSign.start- now);
      } else {
        dur = dayjs.duration(crtSign.end - now);
      }
      const hours = dur.hours();
      let minutes = dur.minutes();
      if (hours === 0 && minutes === 0) {
        minutes = 1;
      }
      r.tips.push({
        plainText: false,
        state: crtSign.step,	
        data: { hours, minutes }
      });
    }
    // 提示：上一次打卡记录，判断是否是缺卡，缺卡则有缺卡的补卡提示
    const preSignIndex = crtSignIndex - 1;
    if (preSignIndex >= 0) {
      const preSign = r.steps[preSignIndex];
      if (preSign.step === 4) {
        r.tips.push({
          plainText: false,
          state: preSign.step,
          data: '上次打卡已缺卡，请说明原因'
        });
      }
    }
    // 提示：到目前为止的打卡异常统计（今日所有打卡还未完成）
    let unnormalCount = -1;
    if (crtSignIndex > 0) {
      let tip = '截止目前应打卡 ' + crtSignIndex + ' 次';
      unnormalCount = r.steps.filter(item => item.step === 3 || item.step === 4).length;
      if (unnormalCount > 0) {
        tip += '，有 ' + unnormalCount + ' 次异常';
      }
      r.tips.push({
        plainText: true,
        data: tip,
        state: -1 // wx:key
      });
    }
    // 提示：全天已结束打卡
    if (crtSignIndex < 0) {
      if (unnormalCount === -1) {
        unnormalCount = r.steps.filter(item => item.step === 3 || item.step === 4).length;
      }
      let tip = '';
      if (unnormalCount > 0) {
        tip = '今日打卡已结束，有 ' + unnormalCount + ' 次异常'; 
      } else {
        tip = '今日打卡已结束，没有异常，再接再厉';
      }
      r.tips.push({
        plainText: true,
        data: tip,
        state: -2 // wx:key
      });
    }
  }
  return r;
}

function getDefaultStep(): ISignStep {
  return {
    current: false,
    done: false,
    startMin: '00:00',
    endMin: '00:00',
    start: 0,
    end: 0,
    step: 0,
    status: '',
    statusLabel: '',
    orgId: 0,
    id: 0
  }
}

interface SignRenderData {
  success: boolean;
  steps: ISignStep[];
  tips: ISignTip[]
}

export interface ISignStep {
  /** 是否正在打卡 */
  current: boolean;
  /** 是否已过期 */
  done: boolean;
  /** 开始（已）打卡时间(HH:mm) */
  startMin: string;
  start: number;
  /** 结束打卡时间，正在打卡时显示(HH:mm) */
  endMin: string;
  end: number;
  /**
   * - ------ 0 -------- 1 ------ 2 ------- 3 ------ 4 ------
   * -   未到打卡时间 - 打卡中 -- 已打卡 - 越界打卡 -- 缺卡
   * - --------------------    --------------------------
   * -   done: false(0, 1)             done: true(2, 3, 4)
   */
  step: 0 | 1 | 2 | 3 | 4;
  /** 状态样式类 */
  status: '' | 'error' | 'active' | 'success';
  /** 状态显示名称 */
  statusLabel: '' | ('缺卡' | '越界') | '打卡中' | '已打卡';
  /** 机构id */
  orgId: number;
  /** 规则id */
  id: number;
  /** 签到地址 */
  address?: string;
  /** 签到时间(HH:mm) */
  signTime?: string;
}

interface ISignTip {
  plainText: boolean;
  data: string | { hours: number; minutes: number };
  state?: number;
}

// https://console-docs.apipost.cn/preview/4d28dd62c93eb7ea/cf6b84e2119d5d46?target_id=d1efa8e6-c9b4-43e8-9526-aae2af4bdca3#1bffa57c-68ab-11eb-a95d-1c34da7b354c
export interface ISignServerData {
  /** 签到地址 */
  address?: string;
  /** 0,正常；1,越界 */
  addressType?: number;
  /** 开始时间 */
  sTime: string;
  /** 结束时间 */
  eTime: string;
  /** 弹性结束时间 */
  endTime?: string;
  /** 规则id */
  id: number;
  // jgbm: string;
  // latitude: null
  // longitude: null
  /** 机构id */
  orgId: number;
  // personNum: null
  // remark: ""
  /** 签到类型：1-超时打卡 2-主动签到打卡 */
  reportType?: number;
  /** 签到日期 */
  reportDate?: string;
  /** 签到时间（HH:mm:ss） */
  reportTime?: string;
  // ruleId: null
  // uuid: null
}
