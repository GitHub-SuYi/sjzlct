import { queryString } from "../../../libs/query-string";
import reqContext from "../../../services/request";

Component({
  data: {
    title: '公告标题',
    jgmc: '发布机构',
    time: '发布时间',
    content: '加载中...',
    imgList: [] as INoticeFile[],
    fileList: [] as INoticeFile[]
  },
  methods: {
    onLoad(e: AnyObject) {
      const params = queryString.parse(e) as AnyObject;
      if (!params || !params.id) {
        wx.showToast({ title: '参数错误', icon: 'error' });
      } else {
        this.setData({
          title: params.title,
          jgmc: params.jgmc,
          time: params.time
        });
        this.loadData(params.id);
      }
    },
    loadData(id: any) {
      const vm = this;
      reqContext.get<INoticeDetailResponse>('/api/msgNotice/getInfoById?id=' + id).then(({ cdnHost, noticeList }) => {
        let notice: INoticeDetail;
        if (!noticeList || !(notice = noticeList[0])) {
          return wx.showModal({ content: '未找到公告详情。' });
        }
        const data: AnyObject = { content: notice.content };
        const files: INoticeFile[] = [];
        const imgs: INoticeFile[] = [];
        if (notice.imgList && notice.imgList.length) {
          notice.imgList.forEach(e => {
            e.fileUrl = cdnHost + '/' + e.fileUrl;
            imgs.push(e);
          });
        }
        if (notice.annexList && notice.annexList.length) {
          notice.annexList.forEach(e => {
            e.fileUrl = cdnHost + '/' + e.fileUrl;
            files.push(e);
          });
        }
        if (imgs.length) data.imgList = imgs;
        if (files.length) data.fileList = files;
        vm.setData(data);
      }).catch((err: HandledError) => {
        wx.showModal({ content: err.errMsg});
      });
    },
    previewFile(e: WechatMiniprogram.CustomEvent) {
      const fileUrl = e.currentTarget.dataset.file;
      if (fileUrl) {
        wx.showLoading({ title: '下载中' });
        wx.downloadFile({
          url: fileUrl,
          success(res) {
            wx.hideLoading();
            wx.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
            });
          },
          fail() {
            wx.hideLoading();
            wx.showToast({ title: '下载失败' });
          }
        });
      } else {
        wx.showToast({ title: '获取文件失败' });
      }
    },
    previewImage(e: WechatMiniprogram.CustomEvent) {
      const i = e.currentTarget.dataset.index;
      wx.previewImage({
        urls: this.data.imgList.map(e => e.fileUrl),
        current: this.data.imgList[i]?.fileUrl
      });
    },
  }
})

interface INoticeDetailResponse {
  cdnHost: string;
  noticeList: INoticeDetail[];
}

/**
 * annexInfo: "4"
  annexList: [{
    id: 4, fileName: "新建文本文档.txt", fileType: ".txt", fileUrl: "files/jg-355/2022/07/21/165527/Fu0WPJ0UNbaW0xX6BM9bKRcGqmaP.txt"
  }]
  content: "<p>1111111111</p><p>22222222222</p><p>333333333333</p><p><br></p>"
  id: 2
  imgInfo: "0"
  imgList: []
  jgmc: "非羁押人员管控"
  lookCompany: ",,,130102030001010001,,,"
  lookCount: 0
  pubJgbm: "130102030001010001"
  pubTime: "2022-07-21T16:55:27.637"
  pubType: 2
  soft: 50
  status: 0
  title: "123"
 */
interface INoticeDetail {
  id: number;
  title: string;
  content: string;
  annexList: INoticeFile[];
  imgList: INoticeFile[];
  pubTime: string;
  jgmc: string;
}

interface INoticeFile {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
}
