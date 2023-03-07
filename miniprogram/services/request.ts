// --------------------------------------------
// 请求实例。
// @author: YuanYou
// --------------------------------------------

import ScopeRequest, { GlobalRequestConfig } from "../libs/http/Request";
import config from '../libs/config';
import RequestError from "../libs/error/RequestError";
import { getUser, userLogout } from "./user";
import { isObj } from "../libs/validation";

/**
 * 默认接口请求域。
 */
const reqContext = getScopeRequest(config.http?.request?.api!);
export default reqContext;


function getScopeRequest(baseURL: string): ScopeRequest {
  const reqOption: GlobalRequestConfig = {
    baseURL,
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  if (typeof config.http?.requestTimeout === 'number') {
    reqOption.timeout = config.http?.requestTimeout;
  }
  const ctx = new ScopeRequest(reqOption);
  ctx.requestInterceptors.add(opt => {
    const token = getUser().detail?.token;
    if (token) {
      opt.header!['Authorization'] = 'Bearer ' + token;
    }
    config.env === 'dev' && console.log('[Request]', opt);
  });
  ctx.responseInterceptors.add(({response: res, request: req}) => {
    let errMsg = `服务器出现错误(HTTP CODE: ${res.statusCode})。`;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const body = res.data as { code: number, data: any, msg: string };
      if (body.code === 105) {
        errMsg = `用户身份已过期，请重新登录(BIZ CODE: ${body.code})。`;
        userLogout();
      } else if (body.code !== 100) {
        errMsg = body.msg || `请求失败(BIZ CODE: ${body.code})。`;
      } else {
        return body.data;
      }
    } else {
      if (isObj(res.data)) {
        errMsg += (res.data as AnyObject).msg || '';
      } else if (typeof res.data === 'string') {
        errMsg += res.data;
      }
    }
    // wx.showToast({ title: errMsg, icon: 'error' });
    if (config.env === 'dev') {
      errMsg += `\n(开发环境信息：${req.url})`;
    }
    return Promise.reject(new RequestError(errMsg, req));
  });
  return ctx;
}
