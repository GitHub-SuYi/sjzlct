// 屏幕信息获取

let width: number, height: number;

/** 获取屏幕可用宽高（像素）。 */
export function getWindowSize() {
  if (!width || !height) {
    const r = wx.getSystemInfoSync();
    width = r.windowWidth;
    height = r.windowHeight;
  }
  return { width, height };
}