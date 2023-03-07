// --------------------------------------------
// 用于编码、解码对象类型的 URL 查询参数。
// @behavior
// @author YuanYou
// --------------------------------------------

import { queryString } from "../libs/query-string"

export default Behavior({
  properties: {
    _p_: String
  },
  data: {
    queryString: {}
  },
  methods: { queryString },
  lifetimes: {
    attached() {
      this.setData({
        queryString: queryString.parse(this.data._p_)
      })
    }
  }
})
