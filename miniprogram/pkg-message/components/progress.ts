// pkg-message/components/progress.ts
// 消息上传或下载进度
Component({
  properties: {
    value: { type: Number, optionalTypes: [String], value: 0 },
    label: { type: String, value: '' },
    // /** 进度类型，可选值："upload", "download" */
    // action: { type: String, value: 'download' },
    // /** 下载时为文件远程地址，上传是为文件本地地址。 */
    // url: String
  },
  // data: {
  //   widthStyle: 'width: 0%;',
  //   widthDisplay: '0%',
  //   label: '',
  // },
  // methods: {
  //   download(url: string) {
  //     const vm = this;
  //     vm.setData({ label: '下载中', ...vm._getWidthData(0) });
  //     console.log('call [progress].download', url);
  //     setTimeout(() => vm.setData(vm._getWidthData(80)), 2000)
  //   },
  //   upload(path: string) {
  //     const vm = this;
  //     vm.setData({ label: '上传中', ...vm._getWidthData(0) });
  //     console.log('call [progress].upload', path);
  //     setTimeout(() => vm.setData(vm._getWidthData(80)), 2000)
  //   },
  //   _getWidthData(width: number) {
  //     const widthDisplay = width + '%';
  //     const widthStyle = 'width:' + widthDisplay;
  //     return { widthDisplay, widthStyle }
  //   },
  // },
})
