// pkg-message/components/message-text.ts
Component({
  properties: {
    /** 文本消息内容。 */
    text: { type: String, value: '' },
    /** 是否是自己发送的消息。 */
    mine: { type: Boolean, value: false }
  },
})
