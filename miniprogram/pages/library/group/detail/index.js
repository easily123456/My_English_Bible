// pages/library/group/detail/index.js
const db = wx.cloud.database()
const _ = db.command
Page({
  data: {
    groupId: '',       // 小组ID
    groupName: '',     // 小组名称
    libraryId: '',     // 所属知识库ID
    libraryIndex: -1,  // 知识库索引，用于判断跳转路径
    itemList: []       // 小组下的知识点列表
  },

  // 页面加载时获取参数并查询数据
  onLoad(options) {
    const { groupId, groupName, libraryId } = options
    this.setData({ groupId, groupName, libraryId })
    // 获取知识库索引，用于判断跳转路径
    this.getLibraryIndex(libraryId)
    // 查询小组下的所有知识点
    this.getGroupItems(groupId)
  },
  
  // 获取知识库列表以确定当前知识库的索引
  getLibraryIndex(libraryId) {
    db.collection('libraries')
      .get()
      .then(res => {
        const libraryList = res.data
        const libraryIndex = libraryList.findIndex(item => item._id === libraryId)
        this.setData({ libraryIndex })
      })
      .catch(err => {
        console.error('获取知识库列表失败：', err)
        this.setData({ libraryIndex: -1 })
      })
  },

  // 下拉刷新重新加载
  onPullDownRefresh() {
    this.getGroupItems(this.data.groupId, () => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 核心逻辑：查询小组下的所有知识点
   * 步骤：
   * 1. 查询item_set_relations，获取该小组关联的所有itemId
   * 2. 根据itemId批量查询knowledge_items，获取知识点详情
   */
  getGroupItems(groupId, callback) {
    wx.showLoading({ title: '加载知识点...' })
    
    // 步骤1：查询关联表，获取该小组的所有itemId
    db.collection('item_set_relations')
      .where({
        groupId: groupId
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

        // 步骤2：根据itemId查询知识点详情
        return db.collection('knowledge_items')
          .where({
            _id: _.in(itemIds)
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

  // 跳转到知识点详情页
  goToItemDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?knowledgeId=${id}`
    });
  },

  // 跳转到创建知识点页面
  goToCreate() {
    const { libraryId, groupId, groupName } = this.data;
    wx.navigateTo({
      url: `/pages/knowledge/create/index?libraryId=${libraryId}&groupId=${groupId}&groupName=${groupName}`
    });
  },
  
  // 开始复习按钮点击事件
  startReview() {
    const { libraryId, libraryIndex, groupId, groupName } = this.data;
    
    if (libraryIndex === 3 || libraryIndex === 4) {
      // 第4-5个知识库的小组详情页跳转至collection
      wx.navigateTo({
        url: `/pages/review/collection/index?libraryId=${libraryId}&groupId=${groupId}&groupName=${groupName}&libraryIndex=${libraryIndex}`
      });
    } else if (libraryIndex === 5) {
      // 第6个知识库的小组详情页跳转至confusion
      wx.navigateTo({
        url: `/pages/review/confusion/index?libraryId=${libraryId}&groupId=${groupId}&groupName=${groupName}&libraryIndex=${libraryIndex}`
      });
    } else {
      // 其他情况默认返回上一页
      wx.navigateBack();
    }
  }
})
