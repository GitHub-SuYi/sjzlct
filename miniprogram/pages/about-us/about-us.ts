import config from "../../libs/config";

Component({
  data: {
    phone: config.custom!.orgPhone as string,
    orgName: config.custom!.orgName as string,
  },
  methods: {
    callPhone() {
      wx.makePhoneCall({
        phoneNumber: this.data.phone,
        success(){}
      });
    },
    goOrgWebsite() {
      this.pageRouter.navigateTo({
        url: '../webview/webview?url=' + encodeURIComponent(config.webviews!.orgWebsite)
      });
    },
  }
})
