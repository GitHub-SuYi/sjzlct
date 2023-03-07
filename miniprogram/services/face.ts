// --------------------------------------------
// 人脸验证服务。
// @author: YuanYou
// --------------------------------------------
import config from '../libs/config';
import { registFaceset, FaceImageType, readImageAsBase64, matchFaceset } from '../libs/bdface/index';
import HandledError from '../libs/error/HandledError';
import { getUser } from './user';
import reqContext from './request';

/** 将图片内容与当前登录用户注册的人脸匹配。 */
export function matchFace(filePath: string): Promise<void> {
  const user = getUser();
  if (user.isGuest) return Promise.reject(new HandledError('用户未登录。'));
  const userInfo = user.detail;
  // const userInfo = (user.detail = { jgbm: '130102030001010001', uid: '9' } as any);
  if (!userInfo || (!userInfo.faceID && !userInfo.faceToken)) {
    return Promise.reject(new HandledError('获取用户信息失败。'));
  }
  const { apiKey, secretKey } = config.custom?.bdface || {};
  if (!apiKey || !secretKey) return Promise.reject(new HandledError('无法读取人脸识别服务的配置数据。'));

  return readImageAsBase64(filePath).then(img => {
    return matchFaceset({
      image: userInfo.faceToken || userInfo.faceID,
      image_type: userInfo.faceToken ? FaceImageType.FACE_TOKEN : FaceImageType.BASE64
    }, {
      image: img.base64,
      image_type: FaceImageType.BASE64
    }, apiKey, secretKey).then(match => {
      if (match.score < 80) {
        return Promise.reject(new HandledError('匹配度较低，请重试。'));
      }
    });
  });
}

/** 注册人脸图像同步用户信息。 */
export function registFace(base64: string): Promise<void> {
  const user = getUser();
  if (user.isGuest) return Promise.reject(new HandledError('用户未登录。'));
  const userInfo = user.detail;
  // const userInfo = (user.detail = { jgbm: '130102030001010001', uid: '9' } as any);
  if (!userInfo) return Promise.reject(new HandledError('获取用户信息失败。'));
  const { apiKey, secretKey } = config.custom?.bdface || {};
  if (!apiKey || !secretKey) return Promise.reject(new HandledError('无法读取人脸识别服务的配置数据。'));

  // 注册百度人脸库
  return registFaceset({
    image: base64,
    image_type: FaceImageType.BASE64,
    group_id: userInfo.jgbm,
    user_id: userInfo.uid
  }, apiKey, secretKey).then(faceInfo => {
    const faceToken = faceInfo.face_token;
    // 提交到业务服务器
    // wx.showModal({ content: faceToken + '\n' + base64 })
    return reqContext.post('/api/bindingUserInfo', {
      faceID: base64,
      faceToken: faceToken
    }).then(() => faceToken);
  }).then(faceToken => {
    // 同步用户信息
    userInfo.faceToken = faceToken;
    userInfo.faceID = base64;
    user.storeDetail();
  });
}