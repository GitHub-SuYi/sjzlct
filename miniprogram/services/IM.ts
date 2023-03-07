// --------------------------------------------
// 即时通讯服务。
// @author: YuanYou
// --------------------------------------------

import config from "../libs/config";
import HandledError from "../libs/error/HandledError";
import { unique } from "../libs/object";
import { LogLevel } from "../libs/signalr/index";
import Store from "../libs/Store";
import { getUser } from "./user";
import WS from "../libs/WS";
import { EventScope } from "../libs/event";

/** IM缓存键对应的加组历史。 */
const groupStore = Store.create<Record<string, string[]>>();
/** IM缓存键对应的事件源。 */
const eventStore = Store.create<Record<string, EventScope>>();
/** 事件类型集合。 */
const eventTypes = {
  /** 其他人加入进群的事件。 */
  OTHER_ADD_GROUP: 'otherAddGroup',
  /** 其他人退出进群的事件。 */
  OTHER_REMOVE_GROUP: 'otherRemoveGroup',
  /** 接收到其他人的聊天消息的事件。 */
  CHAT: 'onReceivedChatMessage',
  /** 接收到所有人（包括自己）的聊天消息的事件。 */
  CHAT_ALL: 'onReceivedAllChatMessage',
  /** 主动定位事件。 */
  LOCTION: 'onLocationImmediately',
  /** 接收到系统通知公告消息的事件。 */
  SYSTEM_NOTICE: 'onReceivedSystemNotice',
  /** 接收到控制命令的事件。 */
  CONTROL: 'onReceivedContrlCmd',
  /** 接收到报警通知消息的事件。 */
  ALARM: 'onReceivedAlarmMessage',
};

class IM {
  /** 配置文件中`http.webSocket`节点所属对象的属性。 */
  private websoketKey: string;
  /** SignalR服务端加组方法。 */
  private addGroupMethod: string;
  /** SignalR服务端退组方法。 */
  private removeGroupMethod: string;
  private clientSendMethod: string;
  /** 当前用户的IM pushId。 */
  private get pushId() { return getUser().detail?.pushId; };
  /** 当前IM服务所使用的连接管理器，客户端调用或监听服务端消息时通过该连接调度。 */
  private ws: WS;
  /** 获取当前IM服务的事件调度中心，相同`websoketKey`的实例共享同一个事件调度。 */
  private get event() {
    if (!eventStore.existStrict(this.websoketKey)) {
      eventStore.set(this.websoketKey, new EventScope());
    }
    return eventStore.get(this.websoketKey);
  }

  /** 获取当前IM服务已加入的群组。 */
  public get groups() {
    return groupStore.get(this.websoketKey) || [];
  }

  public constructor(option: IIMInitOptions) {
    this.websoketKey = option.websoketKey;
    this.addGroupMethod = option.addGroupMethod;
    this.removeGroupMethod = option.removeGroupMethod;
    this.clientSendMethod = option.clientSendMethod;

    const key = this.websoketKey;
    const url = config.http?.webSocket?.[key];
    if (typeof url !== 'string') {
      throw new HandledError(`[IM] 无法从应用配置“http.webSocket”中读取“${key}”。`);
    }
    this.ws = new WS(key, builder => {
      const hub = builder
        .withUrl(url, { accessTokenFactory() { return getUser().detail?.token! } })
        // .withAutomaticReconnect([0, 2000, 4000, 8000, 10000, 30000, 60000])
        .withAutomaticReconnect(new Array(8).fill(2000))
        .configureLogging(config.isProd ? LogLevel.None : LogLevel.Debug)
        .build();
      // 重连后添加历史分组
      hub.onreconnected(() => {
        this.groups.length && this.addGroup();
      });
      // 监听加组、退组消息
      hub.on(this.addGroupMethod, (msg: IMessageOfGroup) => {
        if (msg.pushId !== this.pushId) {
          this.event.emit(eventTypes.OTHER_ADD_GROUP, msg);
        }
      });
      hub.on(this.removeGroupMethod, (msg: IMessageOfGroup) => {
        if (msg.pushId !== this.pushId) {
          this.event.emit(eventTypes.OTHER_REMOVE_GROUP, msg);
        }
      });
      // 监听业务消息
      hub.on('Message', (msgStr: string) => {
        console.log('[IM] 业务消息：', msgStr);
        try {
          const msg: IMessageOfBiz = JSON.parse(msgStr);
          if (typeof msg !== 'object' || typeof msg.type !== 'string') return;
          let eventData: any = msg.data, eventType: string = '';
          switch (msg.type) {
            case BizMessageType.Chat:
              eventType = eventTypes.CHAT_ALL;
              const _chatData: IMessageOfChat = JSON.parse(msg.data.content);
              eventData = _chatData;
              // 额外触发一次其他人的消息事件
              if (this.pushId && this.pushId !== _chatData.pushId) {
                this.event.emit(eventTypes.CHAT, _chatData);
              }
              break;
            // ? 该事件是否在使用存疑 ?
            case BizMessageType.Location:
              eventType = eventTypes.LOCTION;
              break;
            case BizMessageType.System:
              eventType = eventTypes.SYSTEM_NOTICE;
              eventData = JSON.parse(msg.data as string);
              break;
            case BizMessageType.Control:
              eventType = eventTypes.CONTROL;
              // {"type":"control","data":"{\"ctype\":1}","PushId":"jz-23"}
              // or
              // {"type":"control","data":{"ctype":2,"rate":5}}
              if (typeof msg.data === 'string') {
                eventData = JSON.parse(msg.data);
              }
              break;
            case BizMessageType.Alarm:
              const _alarmData: IMessageOfAlarm = JSON.parse(msg.data as string);
              if (_alarmData.JGBM && this.groups.includes(_alarmData.JGBM)) {
                eventType = eventTypes.ALARM;
                eventData = _alarmData;
              }
              break;
          }
          eventType && this.event.emit(eventType, eventData);
        } catch (err) {
          config.isDev && console.error('[IM] 接收并处理业务消息时发生错误。', err);
        }
      });
      return hub;
    });
  }

  /** 添加分组，不设置分组名称则添加历史分组。 */
  public addGroup(group?: string | string[]): Promise<void> {
    const ctx = this;
    const history = ctx.groups;
    let groups: string[];
    if (typeof group === 'undefined') {
      // 使用历史分组
      if (!history || !history.length) {
        return Promise.reject(new HandledError('[IM] 没有历史分组可供加组。'));
      }
      groups = history;
    } else {
      groups = typeof group === 'string' ? [group] : (Array.isArray(group) ? group : []);
      if (!groups.length) {
        return Promise.reject(new HandledError('[IM] 参数错误，请设置要添加的分组。'));
      }
      // 将本次要加的组合并到到历史分组中
      groupStore.set(ctx.websoketKey, unique([...history, ...groups]));
    }
    return ctx.ws.ready().then(hub => {
      const tasks = groups.map(g => {
        const gt = hub.invoke(ctx.addGroupMethod, g).then((res) => {
          config.isDev && console.log(`[IM] 添加分组"${g}"成功。服务端返回值：`, res);
        });
        gt.catch(err => { config.isDev && console.error(`[IM] 添加分组"${g}"失败。`, err) });
        return gt;
      });
      const t = Promise.all(tasks).then(() => {});
      t.finally(() => {
        config.isDev && console.log('[IM] 添加分组结束，目前有效分组：', ctx.groups);
      });
      return t;
    });
  }

  /** 移除分组，不设置分组名称则移除所有的历史分组。注意：不保证移除成功。 */
  public removeGroup(group?: string | string[]): Promise<void> {
    const ctx = this;
    const history = ctx.groups;
    let groups: string[];
    if (typeof group === 'undefined') {
      // 移除所有历史分组
      groups = history;
    } else {
      groups = typeof group === 'string' ? [group] : (Array.isArray(group) ? group : []);
    }
    if (!groups || !groups.length) {
      return Promise.resolve();
    }
    return ctx.ws.ready().then(hub => {
      const tasks = groups.map(g => {
        const gt = hub.invoke(ctx.removeGroupMethod, g).then((res) => {
          config.isDev && console.log(`[IM] 移除分组"${g}"成功。服务端返回值：`, res);
          const source = ctx.groups; // 不使用`history`是为了防止引用发生改变
          let removeIdx: number;
          if (source && (removeIdx = source.indexOf(g)) >= 0) {
            source.splice(removeIdx, 1);
          }
        });
        gt.catch(err => { config.isDev && console.error(`[IM] 移除分组"${g}"失败。`, err) });
        return gt;
      });
      return Promise.allSettled(tasks).then(() => {
        config.isDev && console.log('[IM] 移除分组结束，目前有效分组：', ctx.groups);
      });
    });
  }

  /** 退出群组并关闭IM服务。 */
  public close(): Promise<void> {
    const ctx = this;
    return ctx.removeGroup().then(() => ctx.ws.stop());
  }

  /** 向服务端发送数据。 */
  public send(data: Record<string | number, any>) {
    return this.ws.ready().then(hub => hub.invoke(this.clientSendMethod, JSON.stringify(data)));
  }

  /** 监听其他人加入群组，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onAddGroup<T = any>(callback: (msg: IMessageOfGroup) => void, context?: T) {
    return this.event.on(eventTypes.OTHER_ADD_GROUP, callback, context);
  }
  /** 注销其他人加入群组的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offAddGroup(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.OTHER_ADD_GROUP, callback!);
  }
  /** 监听其他人退出群组，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onRemoveGroup<T = any>(callback: (msg: IMessageOfGroup) => void, context?: T) {
    return this.event.on(eventTypes.OTHER_REMOVE_GROUP, callback, context);
  }
  /** 注销其他人退出群组的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offRemoveGroup(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.OTHER_REMOVE_GROUP, callback!);
  }
  /** 监听接收到其他人的聊天消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onChat<T = any>(callback: (msg: IMessageOfChat) => void, context?: T) {
    return this.event.on(eventTypes.CHAT, callback, context);
  }
  /** 注销接收到其他人的聊天消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offChat(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.CHAT, callback!);
  }
  /** 监听接收到所有人（包括自己）的聊天消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onChatAll<T = any>(callback: (msg: IMessageOfChat) => void, context?: T) {
    return this.event.on(eventTypes.CHAT_ALL, callback, context);
  }
  /** 注销接收到所有人（包括自己）的聊天消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offChatAll(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.CHAT_ALL, callback!);
  }
  /** 监听接收到立即主动定位的消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onLocate<T = any>(callback: () => void, context?: T) {
    return this.event.on(eventTypes.LOCTION, callback, context);
  }
  /** 注销接收到主动定位消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offLocate(callback?: () => void) {
    return this.event.off(eventTypes.LOCTION, callback!);
  }
  /** 监听接收到系统通知公告的消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onSystemNotice<T = any>(callback: (msg: IMessageOfSystemNotice) => void, context?: T) {
    return this.event.on(eventTypes.SYSTEM_NOTICE, callback, context);
  }
  /** 注销接收到系统通知公告消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offSystemNotice(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.SYSTEM_NOTICE, callback!);
  }
  /** 监听接收到控制命令的消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onControl<T = any>(callback: (cmd: IMessageOfControl) => void, context?: T) {
    return this.event.on(eventTypes.CONTROL, callback, context);
  }
  /** 注销接收到控制命令消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offControl(callback?: (cmd: any) => void) {
    return this.event.off(eventTypes.CONTROL, callback!);
  }
  /** 监听接收到报警消息，返回是否监听成功。注意如果在页面或组件生命周期中监听，销毁时必须注销，否则将引起不符合预期的现象。 */
  public onAlarm<T = any>(callback: (msg: IMessageOfAlarm) => void, context?: T) {
    return this.event.on(eventTypes.ALARM, callback, context);
  }
  /** 注销接收到报警消息的事件，不传入回调则移除所有的回调函数。并返回是否注销成功。 */
  public offAlarm(callback?: (msg: any) => void) {
    return this.event.off(eventTypes.ALARM, callback!);
  }

}

/** 应用默认IM服务。 */
const im = new IM({ websoketKey: 'im', addGroupMethod: 'AddGroup', removeGroupMethod: 'ReomveGroup', clientSendMethod: 'Send' });
export { im };

/////////////////////////////////////////////////////////////////////////////

/** IM消息中的用户角色。 */
// enum IMUserRole {
//   /** 矫正人员。 */
//   JZ = 1,
//   /** 监管人员。 */
//   JG = 2
// }
/** IM初始化信息。 */
interface IIMInitOptions {
  /** 配置文件中`http.webSocket`节点所属对象的属性，使用相同key初始化的SignalR连接相同。 */
  websoketKey: string;
  /** SignalR服务端加组方法。 */
  addGroupMethod: string;
  /** SignalR服务端退组方法。 */
  removeGroupMethod: string;
  /** 客户端向服务端发送数据的方法。 */
  clientSendMethod: string;
}
/**
 * 群组加群退群消息。
 * ```json
 * {
 * "connectionId": "PiZgD1DnYfWnRBIcfV-B8A",
 * "groupId": "130102030001010001",
 * "id": 0,
 * "jgbm": "130102030001010001",
 * "lastOfflineTime": null,
 * "lastOnlineTime": "0001-01-01T00:00:00",
 * "machine": "orBRG5FMUMww_7_32OPR5Rjf07bE",
 * "name": "weapp1",
 * "pushId": "jz-9",
 * "role": 1,
 * "supplier": 13,
 * "uid": "9"
 * }
 * ```
 */
interface IMessageOfGroup {
  // connectionId: string;
  /** 群组IM-id。 */
  groupId: string;
  // id: number;
  /** 用户所属机构编码。 */
  jgbm: string;
  // lastOfflineTime: null
  // lastOnlineTime: "0001-01-01T00:00:00"
  // machine: "orBRG5FMUMww_7_32OPR5Rjf07bE"
  /** 用户名称。 */
  name: string;
  /** 用户IM-id，矫正人员：`jz-{uid}`，监管人员：`jg-{uid}`。 */
  pushId: string;
  /** 用户身份类型（1：矫正人员；2：监管人员）。 */
  role: 1 | 2;
  /** 设备类型（6-android 7-ios 13-小程序）  */
  supplier: number;
  /** 用户数据库主键id。  */
  uid: string;
}
/** 业务消息类型。 */
enum BizMessageType {
  /** 即时聊天消息 */
  Chat = 'chatMsg',
  /** 系统通知公告 */
  System = 'sysMsg',
  /** 定位数据 */
  Location = 'location',
  /** 报警 */
  Alarm = 'alarm',
  /** 控制命令 */
  Control = 'control'
}
/** 业务消息。 */
interface IMessageOfBiz {
  /** 业务消息类型。 */
  type: BizMessageType;
  /** 消息内容。 */
  data: any;
  /** 群聊时，接收消息的机构的编码。 */
  GroupId?: string;
  /** 单聊时，接收消息的人的pushid（如"jz-1"或"jg-1"）。 */
  PushId?: string;
}
/**
 * 聊天消息内容。
 * ```json
 * {
    "msgType": 1,
    "pushId": "jg-355",
    "contents": "images/jg-355/2022/09/13/170333/FkCd6Z9Y6xxjvG9CRoQTvdBSy_Vr.png",
    "accepter": "jz-9",
    "contentType": 2,
    "xm": "非羁押",
    "jgmc": "非羁押人员管控",
    "sendTime": "2022-09-13 17:03:33",
    "isSend": 1,
    "name": "Avatar-4.png",
    "size": 3,
    "width": "64",
    "height": "64",
    "length": 0,
    "fileType": "png",
    "faceImage": null,
    "jgbm": "130102030001010001",
    "chatJgbm": "130102030001010001"
  }
 * ```
 */
interface IMessageOfChat {
  /** 发送人的pushId */
  pushId: string;
  /** 发送人的真实机构编码 */
  jgbm: string;
  /** 发送人的真实机构名称 */
  jgmc: string;
  /** 发送人姓名 */
	xm: string;
  /** 聊天内容来自哪个聊天群（分组） */
  chatJgbm: string;
  /** 消息接收者(群pushId<分组>或者接收者用户pushId<jg-1, jz-1>) */
  accepter: string;
  /** 聊天类型(0-群聊;1-单聊) */
  msgType: ChatType;
  /** 聊天内容；文件类型的消息为文件地址（不包括Host地址） */
  contents: string;
  /** 聊天内容类型(0-默认 1-文字 2-图片 3-视频 4-语音 5-加入群组 6-位置 7-文件 8-语言 9-视频 10-音频) */
  contentType: ChatMessageType;
  /** 消息发送时间 */
  sendTime: string;
  /** 消息发送状态(0：发送失败；1：发送成功；2：发送中) */
  isSend: ChatMessageState;

  /** 资源文件名 */
  name: string;
  /** 大小（KB？字节？） */
  size: number;
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
  /** 长度（毫秒） */
  length: number;
  /** 文件类型（jpg、png、MP3、MP4等） */
  fileType: string;
  /** 视频封面图 */
  faceImage: string;
}
/** 聊天室类型(0-群聊;1-单聊)。 */
export enum ChatType {
  /** 群聊。 */
  Group = 0,
  /** 单聊。 */
  Person = 1,
}
/** 聊天消息内容类型。 */
enum ChatMessageType {
  /** 未知消息类型 */
  Unknown = 0,
  /** 文本消息 */
  Text = 1,
  /** 图片消息 */
  Image = 2,
  /** 视频聊天消息 */
  VideoCall = 3,
  /** 语音消息*/
  Voice = 4,
  /** 加组消息 */
  AddGroup = 5,
  /** 位置消息 */
  Location = 6,
  /** 文件 */
  File = 7,
  /** 语音电话 */
  VoiceCall = 8,
  /** 视频文件 */
  Video = 9,
  /** 音频文件 */
  Audio = 10,
}
/** 聊天消息发送状态(0：发送失败；1：发送成功；2：发送中)。 */
enum ChatMessageState {
  /** 发送失败 */
  Fail = 0,
  /** 发送成功 */
  Success = 1,
  /** 发送中 */
  Sending = 2,
}
/** 系统公告通知消息内容。 */
interface IMessageOfSystemNotice {
  [x: string]: any
}
/**
 * 报警消息内容。
 * ```json
 * {
    "TaskId": 105,
    "JGBM": "510101010001130010",
    "SQJZRYBH": "5101012020030026",
    "DWHM": "869551030097366",
    "Lng": "103.971362",
    "Lat": "30.629841",
    "BJSJ": "2020-03-23T16:55:56",
    "BJLX": 4,
    "BJMC": "拆卸报警",
    "XM": "陈奎",
    "Address": "四川省成都市武侯区簇锦街道武兴五路433号2栋西部智谷A区",
    "Tags": []
  }
 * ```
 */
interface IMessageOfAlarm {
  TaskId: number,
  JGBM: string,
  SQJZRYBH: string,
  DWHM: string,
  Lng: string,
  Lat: string,
  BJSJ: string,
  BJLX: 4,
  BJMC: string,
  XM: string,
  Address: string,
  Tags: any[]
}
/** 控制消息。 */
export interface IMessageOfControl {
  /**
   * 控制类型。
   * - 1: 主动上传位置
   * - 2: 控制定位上传频率
   */
  ctype: 1 | 2;
  /** `ctype`为2时，指定的上传频率（分钟）。  */
  rate: number;
}

