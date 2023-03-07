// interface IAppOption {
//   globalData: {
//     userInfo?: WechatMiniprogram.UserInfo,
//   }
//   userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
// }

// 自定义 MP 扩展

type PageRouter = {
  navigateBack<T extends WechatMiniprogram.NavigateBackOption = WechatMiniprogram.NavigateBackOption>(
    option?: T
  ): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.NavigateBackOption>,

  navigateTo<T extends WechatMiniprogram.NavigateToOption = WechatMiniprogram.NavigateToOption>(
    option: T
  ): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.NavigateToOption>,

  reLaunch<T extends WechatMiniprogram.ReLaunchOption = WechatMiniprogram.ReLaunchOption>(
    option: T
  ): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.ReLaunchOption>,

  redirectTo<T extends WechatMiniprogram.RedirectToOption = WechatMiniprogram.RedirectToOption>(
    option: T
  ): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.RedirectToOption>,

  switchTab<T extends WechatMiniprogram.SwitchTabOption = WechatMiniprogram.SwitchTabOption>(
    option: T
  ): WechatMiniprogram.PromisifySuccessResult<T, WechatMiniprogram.SwitchTabOption>
}

declare namespace WechatMiniprogram.Page {
  interface InstanceProperties {
    pageRouter: PageRouter
  }
}

declare namespace WechatMiniprogram.Component {
  interface InstanceProperties {
    pageRouter: PageRouter
  }
}