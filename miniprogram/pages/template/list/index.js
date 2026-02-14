const db = wx.cloud.database()

Page({
  data: {
    templateList: [],
    loading: true
  },

  onLoad() {
    this.getList()
  },

  onPullDownRefresh() {
    this.getList(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 获取作文模板列表
  getList(callback) {
    this.setData({ loading: true })

    db.collection('essay_templates')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          templateList: res.data,
          loading: false
        })
        callback && callback()
      })
      .catch(err => {
        console.error(err)
        this.setData({ loading: false })
        callback && callback()
      })
  },

  // 进入详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/template/detail/index?id=${id}`
    })
  },

  // 去创建
  goToCreate() {
    wx.navigateTo({
      url: '/pages/template/create/index'
    })
  }
})