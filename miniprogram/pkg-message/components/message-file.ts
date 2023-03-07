// pkg-message/components/message-file.ts
import { isEmptyObj } from "../../libs/validation";
import { downloadFile } from "../../libs/http/download";
import { uploadFile, UploadFileType } from "../../services/upload";

/** 自己发送本地文件消息时，自动上传成功后的事件，事件参数为 `service/upload#IQiniuUploadResult`。 */
const UPLOAD_EVENT = 'upload-success';

Component({
  options: {
    pureDataPattern: /^_/
  },
  properties: {
    /** 文件类型。如"txt","pdf"等。 */
    type: { type: String },
    /** 文件名称。 */
    name: { type: String, value: '文件' },
    /** 文件大小（字节）。 */
    size: { type: Number, value: 0, optionalTypes: [String] },
    /** 文件地址。 */
    url: { type: String },
  },
  data: {
    icon: 'file' as FileIcon,
    showSize: '0K',
    // 下载或上传相关
    showProgress: false,
    progressValue: 0,
    progressLabel: '',
    // 下载后的本地临时文件地址
    _downloadTmpPath: '',
    // 上传后的远程地址
    // _uploadFileUrl: '',
    // 是否正在下载
    _inTask: false
  },
  lifetimes: {
    attached() {
      const data: AnyObject = {};
      if (+this.data.size > 0) {
        data.showSize = formatFileSize(this.data.size);
      }
      const fIcon = formatFileIcon(this.data.type);
      fIcon && (data.icon = fIcon);
      if (!isEmptyObj(data)) {
        this.setData(data);
      }
    },
    /** 检查文件是否是本地文件，是则需要上传到服务器。 */
    ready() {
      const vm = this;
      const file = vm.data.url;
      if (file && isLocalFile(file)) {
        vm.setData(getProgressData('上传中'));
        let _t = -1;
        uploadFile(file, UploadFileType.File, p => {
          clearTimeout(_t);
          _t = setTimeout(() => vm.setData({ progressValue: p.progress }), 100);
        }).then(res => {
          vm.setData({ showProgress: false/*, _uploadFileUrl: res.fullUrl*/ });
          // 通过组件事件通知文件上传成功
          vm.triggerEvent(UPLOAD_EVENT, res);
        }).catch(() => {
          vm.setData({ progressLabel: '发送失败' });
        });
      }
    },
  },
  methods: {
    /** 打开文件。 */
    openFile() {
      const vm = this;
      if (vm.data._inTask) return;
      const file = vm.data.url;
      if (!file) return wx.showToast({ title: '未找到文件', icon: 'error', success(){} });
      const open = (p: string) => {
        wx.openDocument({
          filePath: p,
          showMenu: true
        }).catch(() => {
          wx.showToast({ title: '文件打开失败', icon: 'error' });
        });
      }
      if (vm.data._downloadTmpPath) {
        return open(vm.data._downloadTmpPath);
      }
      if (!isLocalFile(file)) {
        vm.setData({ ...getProgressData('下载中'), _inTask: true });
        let _t = -1;
        downloadFile({
          url: file,
          onProgressUpdate(p) {
            clearTimeout(_t);
            _t = setTimeout(() => vm.setData({ progressValue: p.progress }), 100);
          },
        }).then(res => {
          vm.setData({ showProgress: false, _downloadTmpPath: res.tempFilePath, _inTask: false });
          open(res.tempFilePath);
        }).catch(() => {
          vm.setData({ progressLabel: '下载失败', _inTask: false });
        });
      } else {
        open(file);
      }
    },
  }
})

function getProgressData(label: string) {
  return {
    showProgress: true,
    progressValue: 0,
    progressLabel: label,
  }
}

const chatFileExts = ["B","KB","MB","GB","TB","PB","EB","ZB","YB"];
function formatFileSize(size: number) {
  const index = Math.floor(Math.log(size) / Math.log(1024));
  const s = parseFloat((size / Math.pow(1024, index)).toFixed(2));
  const ext = chatFileExts[index];
  if (!ext) return '超大文件';
  return s + ' ' + ext;
}
function formatFileIcon(type: string) {
  let showType: FileIcon | undefined;
  const fileType = (type + '').trim().toLowerCase();
  if (fileType !== 'undefined') {
    switch (fileType) {
      case 'xls':
      case 'xlsx':
        showType = 'file-excel';
        break;
      case 'pdf':
        showType = 'file-pdf';
        break;
      case 'ppt':
      case 'pptx':
        showType = 'file-powerpoint';
        break;
      case 'doc':
      case 'docx':
        showType = 'file-word';
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'raw':
        showType = 'file-image';
        break;
    }
  }
  return showType;
}
function isLocalFile(file: string) {
  return !file.startsWith('https://') && !file.startsWith('http://');
}

type FileIcon = 'file-excel' | 'file-image' | 'file-pdf' | 'file-powerpoint' | 'file-word' | 'file' | 'file-unknown'
