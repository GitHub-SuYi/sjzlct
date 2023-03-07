# 概论、约定
* 小程序的渲染层和逻辑层分别由2个线程管理；
* 整个小程序只有一个 App 实例，是全部页面共享的；
* [场景值](https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html)：可以在 App 的 onLaunch 和 onShow，或[`wx.getLaunchOptionsSync`](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html) 中获取上述场景值；
* 监听数据变化使用[数据监听器](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/observer.html)，不要使用 `properties` 的 `observer`；
* 不用于页面渲染的字段使用[纯数据字段](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/pure-data.html)，使用 `options.pureDataPattern: /^_/` 定义；
* 页面（Page）都是用 `Component` 构造；
* 项目中安装了 [miniprogram-computed](https://github.com/wechat-miniprogram/computed)，可在页面或组件中使用 computed 和 watch；
* 路由：禁止使用 `wx.navigateTo` 等接口，使用 `this.pageRouter.navigateTo` 等接口；
* 导航栏：禁止使用 `wx.setNavigationBarTitle` 等接口，在页面WXML只使用 [`<page-meta>`](https://developers.weixin.qq.com/miniprogram/dev/component/page-meta.html) > [`<navigation-bar>`](https://developers.weixin.qq.com/miniprogram/dev/component/navigation-bar.html) 组件；


# 核心
* [App](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/app.html)
  * [API文档](https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html)；
  * getApp 方法获取到全局唯一的 App 实例；

* Behaviors
  * 每个 behavior 可以包含一组[属性、数据、生命周期函数和方法](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Behavior.html)；
  * 在组件中的扩展，使用 `definitionFilter` 定义段（definitionFilter 是一个函数，在被调用时会注入两个参数）：
    * 第一个参数是使用该 behavior 的 component/behavior 的定义对象；
    * 二个参数是该 behavior 所使用的 behavior 的 definitionFilter 函数列表；
    > 简单概括，definitionFilter 函数可以理解为当 A 使用了 B 时，A 声明就会调用 B 的 definitionFilter 函数并传入 A 的定义对象让 B 去过滤。此时如果 B 还使用了 C 和 D ，那么 B 可以自行决定要不要调用 C 和 D 的 definitionFilter 函数去过滤 A 的定义对象。

* [Page](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page.html)
  * [API文档](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)；
  * getCurrentPages 方法获取页面实例；
  * 生命周期函数 和 自定义函数同级并列；响应式数据放到 `data` 中，非响应式数据与自定义函数同级；
  * [behaviors（含内置）](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html)：类似于 vue 中的 mixins；
  * `setData` 方法单次设置的数据不能超过1024kB，请尽量避免一次设置过多的数据；也不要把 data 中任何一项的 value 设为 undefined ；
  * **页面间通信**：
  
    *前提：一个页面由另一个页面通过 wx.navigateTo 打开*

      * 被打开的页面可以通过 this.getOpenerEventChannel() 方法来获得一个 EventChannel 对象；
      * wx.navigateTo 的 success 回调中也包含一个 EventChannel 对象。
  * <span id="page-with-component">使用 [`Component` 构造页面](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html)</span>
    * 拥有与普通组件一样的定义段与实例方法，但此时要求对应 json 文件中包含 `usingComponents` 定义段： 
      ``` json
      {
        "usingComponents": {}
      }
      ```
    * 组件的属性(`properties`)可以用于接收页面的参数；
    * **页面的生命周期方法（即 on 开头的方法），应写在 methods 定义段中**；
  * [页面生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html)。
* [Component](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)

  * [组件生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html)；
  * properties：组件的对外属性。定义段中，属性名采用驼峰写法（propertyName）；在 wxml 中，指定属性值时则对应使用连字符写法（component-tag-name property-name="attr value"）；
  * data：和 `properties` 一起用于渲染模板；
  * [observers](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/observer.html)：监听 properties 和 data 的变化；
  * lifetimes：`created` > `attached` > `ready` > `moved` > `detached`
  * methods：自定义函数；
  * behaviors：mixins；
  * pageLifetimes：组件所在页面的生命周期声明对象；
  * router：相对于当前自定义组件的 Router 对象；
  * pageRouter：相对于当前自定义组件所在页面的 Router 对象；
  * [使用组件构造页面](#page-with-component)；
  * [组件通信](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html)
    * WXML 数据绑定：用于父组件向子组件的指定属性设置数据；
    * 事件：用于子组件向父组件传递数据（`this.triggerEvent`），可以传递任意数据；
    * 父组件还可以通过 `this.selectComponent` 方法获取子组件实例对象，这样就可以直接访问组件的任意数据和方法。
监听事件
  * [WXML中的公共属性](https://developers.weixin.qq.com/miniprogram/dev/framework/view/component.html)：`id`，`class`，`style`，**<u>`hidden`</u>**，`data-*`，`bind* / catch*`
  * 使用 usingComponents 时， setData 内容不会被直接深复制，即 this.setData({ field: obj }) 后 this.data.field === obj 。（深复制会在这个值被组件间传递时发生。）
  * [抽象节点](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/generics.html)
  * 通过组件属性向组件内部传值时，只能传递 JSON 兼容数据，可以在数据中包含函数（但这些函数不能在 WXML 中直接调用，只能传递给子组件）；
  * slot
    * 默认情况下，一个组件的 wxml 中只能有一个 slot 。需要使用多 slot 时，可以在组件 js 中声明启用：
    ``` js
    Component({
      options: {
        multipleSlots: true // 在组件定义时的选项中启用多 slot 支持
      },
      properties: { /* ... */ },
      methods: { /* ... */ }
    })
    ```
    * 此时，可以在这个组件的 wxml 中使用多个 slot ，以不同的 name 来区分：
    ``` html
    <!-- 组件模板 -->
    <view class="wrapper">
      <slot name="before"></slot>
      <view>这里是组件的内部细节</view>
      <slot name="after"></slot>
    </view>
    ```
    * 使用时，用 slot 属性来将节点插入到不同的 slot 上：
    ``` html
    <!-- 引用组件的页面模板 -->
    <view>
      <component-tag-name>
        <!-- 这部分内容将被放置在组件 <slot name="before"> 的位置上 -->
        <view slot="before">这里是插入到组件slot name="before"中的内容</view>
        <!-- 这部分内容将被放置在组件 <slot name="after"> 的位置上 -->
        <view slot="after">这里是插入到组件slot name="after"中的内容</view>
      </component-tag-name>
    </view>
    ```
  * 组件样式
    * 组件 wxss 中<span style="color:red">**不应**</span>使用 ID 选择器、属性选择器和标签名选择器，**请改用 class 选择器**；
    * 组件和引用组件的页面中使用后代选择器（.a .b）在一些极端情况下会有非预期的表现，如遇，请避免使用。
    * 子元素选择器（.a>.b）只能用于 view 组件与其子节点之间，用于其他组件可能导致非预期的情况。
    * 继承样式，如 font 、 color ，会从组件外继承到组件内。
    * **除继承样式外， app.wxss 中的样式、组件所在页面的的样式对自定义组件无效<u>（除非更改组件样式隔离选项，或者，app.wxss 或页面的 wxss 中使用了标签名选择器<或一些其他特殊选择器>来直接指定样式）</u>**。
    * 组件可以指定它所在节点的默认样式，使用 :host 选择器：
    ``` css
    /* 组件 custom-component.wxss */
    :host { color: yellow; }
    ```
    ``` html
    <!-- 页面的 WXML -->
    <custom-component>这段文本是黄色的</custom-component>
    ```
    * 样式隔离（options.styleIsolation）
      ``` js
      Component({
        options: {
          styleIsolation: 'isolated'
        }
      })
      ```
      * `isolated` 表示启用样式隔离，在自定义组件内外，使用 class 指定的样式将不会相互影响（一般情况下的默认值）；
      * `apply-shared` 表示页面 wxss 样式将影响到自定义组件，但自定义组件 wxss 中指定的样式不会影响页面；
      * `shared` 表示页面 wxss 样式将影响到自定义组件，自定义组件 wxss 中指定的样式也会影响页面和其他设置了 apply-shared 或 shared 的自定义组件。（这个选项在插件中不可用。）
    * 外部样式类 (Component.externalClasses)，**可以将 class 设为 externalClasses**
    * 引用页面样式：`<view class="~blue-text">`
    * 引用父组件样式：`<view class="^red-text">`
    * `virtualHost`：组件跟节点定义为虚拟节点，由组件内部第一层节点作为显示节点，此时自定义组件节点上的 `class` `style` 和动画将不再生效，可以：
      * 将 style 定义成 properties 属性来获取 style 上设置的值；
      * 将 class 定义成 externalClasses 外部样式类使得自定义组件 wxml 可以使用 class 值。


组件 wxml 的 slot

* [Event](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html)
  
  * 在 WXML 上绑定的事件回调必须是`函数名称字符串`，为空字符串时绑定失效；
  * `bind`：普通绑定，可以冒泡；
  * `catch`：阻止冒泡；
  * `mut-bind`：互斥事件，一个 mut-bind 触发后，如果事件冒泡到其他节点上，其他节点上的 mut-bind 绑定函数不会被触发；
  * `capture-bind / capture-catch`：捕获阶段触发，捕获阶段位于冒泡阶段之前，且在捕获阶段中，事件到达节点的顺序与冒泡阶段恰好相反。
  * `change:[property]`：（属性前面带change:前缀）是在 prop 属性被设置的时候触发（被设置就会触发，而不只是值发生改变，所以在页面初始化的时候会调用一次事件，例子如下）；
    ``` html
    <wxs module="test" src="./test.wxs"></wxs>

    <view change:prop="{{test.propObserver}}" prop="{{propValue}}" bindtouchmove="{{test.touchmove}}" class="movable"></view>
    ```
    ``` js
    // file: test.wxs
    module.exports = {
      touchmove: function(event, instance) {
        console.log('log event', JSON.stringify(event))
      },
      propObserver: function(newValue, oldValue, ownerInstance, instance) {
        console.log('prop observer', newValue, oldValue)
      }
    }
    ```
  * eventArgument

    * `currentTarget`：事件绑定的组件；
    * `target`：触发事件的源组件，可能是 currentTarget 的子组件；
    * `dataset`：WXML 中，这些自定义数据以 `data-` 开头（**注意全部使用小写，分词以中划线连接**）；
    * `mark`：①用 mark 来识别具体触发事件的 target 节点；②mark 还可以用于承载一些自定义数据（类似于 dataset ）；当事件触发时，事件冒泡路径上所有的 mark 会被合并，并返回给事件回调函数。
    `detail`：自定义事件所携带的数据。
  * <span id="wxs-event">[WXS事件](https://developers.weixin.qq.com/miniprogram/dev/framework/view/interactive-animation.html)</span>

    > **只能**用于在视图层直接响应视图中<u>**内置组件（<span style="color:red">不支持自定组件 和 原生组件</span>）**</u>的事件，减少调用逻辑层事件函数的消耗，提高性能。
    ``` js
    var wxsFunction = function(event, ownerInstance) {
      var instance = ownerInstance.selectComponent('.classSelector') // 返回组件的实例
      instance.setStyle({
          "font-size": "14px" // 支持rpx
      })
      instance.getDataset()
      instance.setClass(className)
      // ...
      return false // 不往上冒泡，相当于调用了同时调用了 stopPropagation 和 preventDefault
    }
    ```
    * 其中入参 event 是小程序事件对象基础上多了 event.instance 来表示触发事件的组件的 ComponentDescriptor 实例；
    * ownerInstance 表示的是触发事件的组件所在的组件的 ComponentDescriptor 实例，如果触发事件的组件是在页面内的，ownerInstance 表示的是页面实例。
    * `ComponentDescriptor`常用方法：[见文档](https://developers.weixin.qq.com/miniprogram/dev/framework/view/interactive-animation.html)；
    * 使用： WXS 函数，值必须用 `{{}}` 括起来

* <span id="two-way-binding">[双向数据绑定](https://developers.weixin.qq.com/miniprogram/dev/framework/view/two-way-bindings.html)</span>
  
  * 使用 `model:[property]`；
  * 双向绑定表达式 **只能使用单一值，不能包含路径**，如：
    ``` html
    <!-- √√√ 合法 -->
    <input model:value="值为 {{value}}" />
    <input model:value="{{ a + b }}" />

    <!-- ××× 非法 -->
    <input model:value="{{ a.b }}" />
    ```
    * 自定义组件中传递双向绑定：**自定义组件内部实现 和 外部调用自定义组件时都是用 `mode:[property]` 绑定值**；
    * 自定义组件中触发双向绑定更新：**自定义组件内部实现中使用 `setData` 设置 `properties` 中的属性值，如果外部调用自定义组件时绑定的对应属性也需要同步双向更新的话，也需要使用 `mode:[property]` 绑定**。


# WXSS
* rpx: 可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。
* 使用@import语句可以导入外联样式表；如：*`@import "common.wxss";`*
* 定义在 app.wxss 中的样式为全局样式，作用于每一个页面。在 page 的 wxss 文件中定义的样式为局部样式，只作用在对应的页面，并会覆盖 app.wxss 中相同的选择器；
* 选择器：`.calss`，`#id`，`element [,element]`, `::before`，`::after`


# WXML
* [数据绑定](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/data.html)

  * [双向数据绑定](#two-way-binding)；
  * 使用 `{{ }}` 绑定值、表达式 或 关键字；
  * 属性值是字符串时直接引号内书写字面量；
* 逻辑语法
  * [`wx:for` (`wx:for-index`, `wx:for-item`)](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html) 
  * [`wx:if` - `wx:elif` - `wx:else`](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/conditional.html)
* [模板 - template](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/template.html)：用于内容复用；
* [模板引用](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/import.html)
  
  * `<import>`：导入后再使用 `<template>` 引用，**作用域：只包含导入文件的内容，不包含嵌套导入的内容**；
  * `<include>`： 除了 \<template/> \<wxs/> 外的整个代码引入，相当于是拷贝到 include 位置；
* \<block>：类似于 vue 文件 template 中使用 template；

# WXS
> WXS 与 JavaScript 是不同的语言，有自己的语法，并不和 JavaScript 一致。
> 通常用来定义响应内置组件的事件回调函数，[详见：核心 - Event - WXS事件](#wxs-event)。

* [模块化、引用、作用域](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/01wxs-module.html)
* js编码：遵守 **`ES5`** 标准，参考：[数据类型
](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/06datatype.html)、[基础类库](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/07basiclibrary.html)
* 引入：
  ``` html
  <wxs module="wxs" src="./test.wxs"></wxs>
  ```

# 注意

https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html

https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth
https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask

https://tdesign.tencent.com/miniprogram/changelog

https://github.com/Tencent/westore