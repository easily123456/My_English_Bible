// pages/library/detail.js
const db = wx.cloud.database()
Page({
  data: {
    libraryId: '',    // 当前知识库ID
    libraryName: '',  // 当前知识库名称
    itemList: []      // 当前知识库下的知识点列表
  },

  // 页面加载时获取参数+查询知识点
  onLoad(options) {
    const { libraryId, libraryName } = options
    this.setData({ libraryId, libraryName })
    // 查询当前知识库下的所有知识点
    this.getLibraryItems(libraryId)
  },

  // 下拉刷新重新加载
  onPullDownRefresh() {
    this.getLibraryItems(this.data.libraryId, () => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 核心逻辑：查询知识库下的所有知识点
   * 步骤：
   * 1. 查询item_set_relations，获取该知识库关联的所有itemId
   * 2. 根据itemId批量查询knowledge_items，获取知识点详情
   */
  getLibraryItems(libraryId, callback) {    //调用时未传入callback，则默认未undefined
    wx.showLoading({ title: '加载知识点...' })
    
    // 步骤1：查询关联表，获取该知识库的所有itemId
    db.collection('item_set_relations')
      .where({
        setId: libraryId,
        setType: 'library' // 关键：只查知识库关联
      })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          // 无关联知识点
          wx.hideLoading()
          this.setData({ itemList: [] })
          callback && callback()
          return
        }

        // 提取所有itemId，知识库的知识点id列表
        const itemIds = res.data.map(item => item.itemId)   //每个进入循环的item再提取其中的itemId，组成一个新的数组
        

        // 步骤2：根据itemId查询知识点详情
        return db.collection('knowledge_items')
          .where({
            _id: db.command.in(itemIds) // 将itemIds里面对应的知识点取出来
          })
          .get()    //返回一个Promise
      })
      .then(res => {
        wx.hideLoading()
        if (res) {
          this.setData({ itemList: res.data })
        }
        callback && callback()
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error('获取知识点失败：', err)
        callback && callback()
      })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 跳转到创建知识点页面
  goToCreate() {
    wx.navigateTo({
      url: '/pages/knowledge/create'
    })
  }
})