// pages/library/detail.js
const db = wx.cloud.database()
Page({
  data: {
    libraryId: '',    // 当前知识库ID
    libraryName: '',  // 当前知识库名称
    libraryType: '',  // 知识库类型
    itemList: []      // 当前知识库下的知识点列表
  },

  // 页面加载时获取参数+查询知识点
  onLoad(options) {
    const { libraryId, libraryName } = options
    this.setData({ libraryId, libraryName })
    this.getLibraryDetail(libraryId)
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
  getLibraryItems(libraryId, callback) {
    wx.showLoading({ title: '加载知识点...' })
    
    // 步骤1：查询关联表，获取该知识库的所有itemId
    db.collection('item_set_relations')
      .where({
        setId: libraryId,
        setType: 'library' // 只查知识库关联
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

        // 提取所有itemId
        const itemIds = res.data.map(item => item.itemId)

        // 步骤2：根据itemId查询知识点详情（适配新字段）
        return db.collection('knowledge_items')
          .where({
            _id: db.command.in(itemIds)
          })
          .get()
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

  // 跳转到创建知识点页面（补充传参：当前知识库ID，方便创建时自动选中）
  goToCreate() {
    const { libraryId, libraryName } = this.data;
    wx.navigateTo({
      url: `/pages/knowledge/create/index?libraryId=${libraryId}&libraryName=${libraryName}`
    });
  },

  // 查询知识库详情（获取libraryType）
  getLibraryDetail(libraryId) {
    db.collection('libraries')
      .doc(libraryId)
      .get()
      .then(res => {
        this.setData({
          libraryType: res.data.libraryType || 'single' // 默认single类型
        })
      })
      .catch(err => {
        console.error('获取知识库类型失败：', err)
        this.setData({ libraryType: 'single' }) // 兜底
      })
  },

  // 跳转到复习入口页
  startReview(e) {
    // console.log("进入跳转至复习入口函数")
    const { libraryId, libraryType, libraryName } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/review/start/index?libraryId=${libraryId}&libraryType=${libraryType}&libraryName=${libraryName}`
    })
    // console.log("结束跳转至复习入口函数")
  },
  goToItemDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?knowledgeId=${id}`
    });
  }
})