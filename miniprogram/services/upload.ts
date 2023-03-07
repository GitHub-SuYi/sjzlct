// ------------------------------------------
// 应用文件上传。
// @author: YuanYou
// ------------------------------------------

import HandledError from "../libs/error/HandledError";
import { QiniuAreas, upload } from "../libs/qiniu";
import reqContext from "./request";

let _qiniuVisitHost = '';
/** 上传指定类型的文件到七牛云。 */
export function uploadFile(filePath: string, fileType = UploadFileType.File, onUploadProgress?: WechatMiniprogram.UploadTaskOnProgressUpdateCallback): Promise<IQiniuUploadResult> {
  if (!filePath) return Promise.reject(new HandledError('[service/upload] 参数错误，上传失败。'));
  return upload<IQiniuUploadResult>(
    {
      filePath, url: QiniuAreas.Sounth.urlOfFastUpload,
      dataType: 'json',
      onProgressUpdate: onUploadProgress
    },
    () => getUploadToken(fileType).then((g) => {
      // console.log('[service/upload] token', g);
      g.domainName && (_qiniuVisitHost = g.domainName);
      return g.uploadToken;
    }),
  ).then((res) => {
    res.fullUrl = _qiniuVisitHost ? _qiniuVisitHost + '/' + res.url : '';
    try {
      // 媒体文件的“宽、高、时长、文件大小”为字符串，转为数字，没有该属性的文件对应值为`null`
      res.width = JSON.parse(res.width + '');
      res.height = JSON.parse(res.height + '');
      res.length = JSON.parse(res.length + '');
      res.size = JSON.parse(res.size + '');
    } catch (_) {}
    // console.log('[service/upload] uploadFile', res);
    return res;
  });
}
/** 上传图片到七牛云。 */
export function uploadImage(filePath: string, onUploadProgress?: WechatMiniprogram.UploadTaskOnProgressUpdateCallback) {
  return uploadFile(filePath, UploadFileType.Image, onUploadProgress);
}
/** 上传视频到七牛云。 */
export function uploadVideo(filePath: string, onUploadProgress?: WechatMiniprogram.UploadTaskOnProgressUpdateCallback) {
  return uploadFile(filePath, UploadFileType.Video, onUploadProgress);
}
/** 上传音频到七牛云。 */
export function uploadAudio(filePath: string, onUploadProgress?: WechatMiniprogram.UploadTaskOnProgressUpdateCallback) {
  return uploadFile(filePath, UploadFileType.Audio, onUploadProgress);
}

/** 上传的文件类型。 */
export enum UploadFileType {
  /**
   * 图片
   */
  Image = 2,
  /**
   * 视频文件
   */
  Video = 3,
  /**
   * 音频文件
   */
  Audio = 4,
  /**
   * 其他文件
   */
  File = 7,
}

/** 获取七牛云上传Token和访问外链地址。 */
function getUploadToken(fileType: UploadFileType) {
  const url = '/api/qiNiu/getUploadToken?fileType=' + fileType;
  return reqContext.get<{uploadToken: string, domainName: string}>(url);
}

/**
 * @@ image
  fileType: ".jpg"
  hash: "FrIXGEt8SzHS0Cwq7Fha-R5JoA17"
  height: "758"
  length: "null"
  name: "tmp_dccebf3d78a454bb6af0178abc1a13f565ff4b4501e1a3e7.jpg"
  size: "39029"
  url: "images/jz-23/2022/09/21/150124/FrIXGEt8SzHS0Cwq7Fha-R5JoA17.jpg"
  user: "jz-23"
  width: "640"
@@ video
  fileType: ".mp4"
  hash: "Fu8bY3uBKdK3d_QNOLoMZg3_A2le"
  height: "296"
  length: "4.319002"
  name: "tmp_54db29fc144f92c45fc74b2358836c98ff8785aaf66a46f4.mp4"
  size: "347935"
  url: "/jz-23/2022/09/21/150359/Fu8bY3uBKdK3d_QNOLoMZg3_A2le.mp4"
  user: "jz-23"
  width: "648"
@@ file
  fileType: ".pdf"
  hash: "FtT4eXUrq3cKopWFn5lwObhDFxGs"
  height: "null"
  length: "null"
  name: "tmp_aef83ff6739096d408bad55815954f65e8397c90f9688496.pdf"
  size: "746719"
  url: "files/jz-23/2022/09/21/152205/FtT4eXUrq3cKopWFn5lwObhDFxGs.pdf"
  user: "jz-23"
  width: "null"
 */
/** 文件上传结果。 */
 interface IQiniuUploadResult {
  /** 文件后缀扩展名，如：`.pdf` `.jpg`。 */
  fileType: string;
  /** 文件唯一`hash`值。 */
  hash: string;
  /** 图像或视频宽度（像素）。 */
  width: number | null;
  /** 图像或视频高度（像素）。 */
  height: number | null;
  /** 音视频文件时长（秒）。 */
  length: number | null;
  /** 文件大小（字节）。 */
  size: number;
  /** 文件原名称。 */
  name: string;
  /** 文件存储路径。 */
  url: string;
  /** 文件访问网络地址。 */
  fullUrl: string;
  /** 上传用户的`push-id`。 */
  user: string;
}
