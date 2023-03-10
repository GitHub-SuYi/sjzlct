// --------------------------------------------
// 百度云接口错误码及其对应的错误描述。
// @author: YuanYou
// --------------------------------------------
const errorMap: Record<string | number, string> = {
  "0": "处理成功。",
  // 接口流控及鉴权错误码
  "4": "集群超限额，请联系监管人员。",
  "6": "没有接口访问权限，请联系监管人员。",
  "17": "日流量超限额，请联系监管人员。",
  "18": "服务器繁忙，稍后再试。",                           // QPS超限额
  "19": "请求总量超限额，稍后再试。",
  "100": "无效的 Access Token，请联系监管人员。",
  "110": "Access Token 失效，请联系监管人员。",
  "111": "Access token 过期，请联系监管人员。",
  // 通用及业务错误码
  "222001": "参数错误，请联系监管人员。",                   // 必要参数未传入 param[] is null
  "222002": "参数错误，请联系监管人员。",                   // param[start] format error
  "222003": "参数错误，请联系监管人员。",                   // param[length] formaterror
  "222004": "参数错误，请联系监管人员。",                   // param[op_app_id_list] format error
  "222005": "参数错误，请联系监管人员。",                   // param[group_id_list] format error
  "222006": "参数错误，请联系监管人员。",                   // group_id format error
  "222007": "参数错误，请联系监管人员。",                   // uid format error
  "222008": "参数错误，请联系监管人员。",                   // face_id format error
  "222009": "参数错误，请联系监管人员。",                   // quality_conf format error
  "222010": "参数错误，请联系监管人员。",                   // user_info format error
  "222011": "参数错误，请联系监管人员。",                   // param[uid_list] format error
  "222012": "参数错误，请联系监管人员。",                   // param[op_app_id] format error
  "222013": "参数错误，请联系监管人员。",                   // param[image] format error
  "222014": "参数错误，请联系监管人员。",                   // param[app_id] format error
  "222015": "参数错误，请联系监管人员。",                   // param[image_type] format error
  "222016": "参数错误，请联系监管人员。",                   // param[max_face_num] format error
  "222017": "参数错误，请联系监管人员。",                   // param[face_field] format error
  "222018": "参数错误，请联系监管人员。",                   // param[user_id] format error
  "222019": "参数错误，请联系监管人员。",                   // param[quality_control] format error
  "222020": "参数错误，请联系监管人员。",                   // param[liveness_control] format error
  "222021": "参数错误，请联系监管人员。",                   // param[max_user_num] format error
  "222022": "参数错误，请联系监管人员。",                   // param[id_card_number] format error
  "222023": "参数错误，请联系监管人员。",                   // param[name] format error
  "222024": "参数错误，请联系监管人员。",                   // param[face_type] format error
  "222025": "参数错误，请联系监管人员。",                   // param[face_token] format erro
  "222026": "参数错误，请联系监管人员。",                   // param[max_star_num] format error
  "222027": "验证码长度错误，请联系监管人员。",
  "222028": "参数错误，请联系监管人员。",                   // param[min_code_length] format error
  "222029": "参数错误，请联系监管人员。",                   // param[max_code_length] format error
  "222030": "参数错误，请联系监管人员。",                   // param[match_threshold] format error
  "222200": "参数错误，请联系监管人员。",                   // 该接口需使用 application/json的 格式进行请求 request body should be json format
  "222201": "参数错误，请联系监管人员。",                   // 服务端请求失败
  "222202": "未检测到人脸，请将人脸图像放入框内后重试。",      // 图片中没有人脸 pic not has face
  "222203": "无法解析人脸，请将人脸图像放入框内后重试。",      // image check fail	
  "222204": "人脸图片解析失败，请重试。",                   // 从图片的url下载图片失败 image_url_download_fail
  "222205": "服务端请求失败，请重试。",                     // network not availablel
  "222206": "服务端请求失败，请重试。",                     // rtse service return fail
  "222207": "未找到匹配的用户，请联系监管人员。",
  "222208": "图片的数量错误，请联系监管人员。",              // 图片的数量错误，多张图片请使用json格式传输
  "222209": "人脸图像不存在，请联系监管人员。",              // face token不存在
  "222210": "人脸库中用户下的人脸数目超过限制，请联系监管人员。",
  "222300": "人脸图像添加失败，请重试。",
  "222301": "获取人脸图像失败，请重试。",
  "222302": "系统错误，请重试。",
  "222303": "获取人脸图像失败，请重试。",
  "223100": "用户组不存在，请联系监管人员。",
  "223101": "该用户组已存在。",
  "223102": "该用户已存在。",
  "223103": "找不到该用户，请联系监管人员。",
  "223104": "包含组数量过多，请联系监管人员。",              // group_list包含组数量过多
  "223105": "该人脸图像已存在。",
  "223106": "该人脸图像不存在，请联系监管人员。",
  "223110": "参数错误，请联系监管人员。",                    // uid_list包含数量过多
  "223111": "目标用户组不存在，请联系监管人员。",             // 目标用户组不存在
  "223112": "参数错误，请联系监管人员。",                    // quality_conf格式不正确
  "223113": "检测到人脸有被遮挡，请将完整的人脸图像放入框内重试。",
  "223114": "人脸模糊，请持稳手机拍摄面部图像或通知监管人员重新采集人脸图像后重试。",
  "223115": "人脸光照不好，请保持人脸面部光照充足、清晰。",
  "223116": "人脸不完整，请将完整的人脸图像放入框内重试。",
  "223117": "参数错误，请联系监管人员。",                   // app_list包含app数量过多
  "223118": "参数错误，请联系监管人员。",                   // 质量控制项错误 	quality control error
  "223119": "参数错误，请联系监管人员。",                   // 活体控制项错误	liveness control item error
  "223120": "请保证是你本人，或参照采集图像重试。",          // liveness check fail 活体检测未通过
  "223121": "左眼遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 左眼遮挡程度过高
  "223122": "右眼遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 右眼遮挡程度过高
  "223123": "左脸遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 左脸遮挡程度过高
  "223124": "右脸遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 右脸遮挡程度过高
  "223125": "下巴遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 下巴遮挡程度过高
  "223126": "鼻子遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 鼻子遮挡程度过高
  "223127": "嘴巴遮挡过多，请将完整的人脸图像放入框内重试。", // 质量检测未通过 嘴巴遮挡程度过高
  "222901": "系统繁忙，请重试。",
  "222902": "系统繁忙，请重试。",
  "222903": "系统繁忙，请重试。",
  "222904": "系统繁忙，请重试。",
  "222905": "系统繁忙，请重试。",
  "222906": "系统繁忙，请重试。",
  "222907": "系统繁忙，请重试。",
  "222908": "系统繁忙，请重试。",
  "222909": "系统繁忙，请重试。",
  "222910": "系统繁忙，请重试。",
  "222911": "系统繁忙，请重试。",
  "222912": "系统繁忙，请重试。",
  "222913": "系统繁忙，请重试。",
  "222914": "系统繁忙，请重试。",
  "222915": "系统繁忙，请重试。",
  "222916": "系统繁忙，请重试。",
  "222304": "图片尺寸太大，请重试。",
  "222305": "无法使用当前服务，请联系监管人员。",           // 当前版本不支持图片存储
  "223128": "系统繁忙，请重试。",                         // 正在清理该用户组的数据 group was deleting
  "222361": "系统繁忙，请重试。",                         // 公安服务连接失败
  "222046": "参数错误，请联系监管人员。",                  // param[template_type] format error
  "222101": "参数错误，请联系监管人员。",                  // param[merge_degree] format error
  "222102": "参数错误，请联系监管人员。",                  // param[face_location] format error
  "222307": "图像内容不健康。",                           // 图片非法 鉴黄未通过
  "222308": "图像内容敏感。",                             // 图片非法 含有政治敏感人物
  "222211": "人脸融合失败。",                             // 人脸融合失败 模板图质量不合格
  "222212": "人脸融合失败。",                             // 人脸融合失败
  "223129": "请将人脸正面面向摄像头并重试。"                // 人脸未面向正前方，
  // TODO 公安验证接口错误码
  // TODO H5活体检测接口错误码列表
  // TODO 实名认证系统错误码列表
};
export default errorMap;