// pages/knowledge/create.js
const db = wx.cloud.database()
Page({
  data: {
    // 基础输入（简化为单字段）
    enContent: '',
    posContent: '',   // 单组词性
    zhContent: '',    // 单组释义
    exampleContent: '',
    // 知识库相关
    libraryList: [],
    checkedLibraryIds: [] //存储用户勾选的知识库 ID 数组
  },

  onLoad(options) {
    this.getLibraryList()
  },

  // 获取知识库列表（不变）
  getLibraryList() {
    wx.showLoading({ title: '加载知识库...' })
    db.collection('libraries')
      .get()
      .then(res => {
        wx.hideLoading()
        this.setData({
          libraryList: res.data
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '加载知识库失败',
          icon: 'none'
        })
        console.error('获取知识库列表失败：', err)
      })
  },

  // 英文输入绑定（不变）
  onEnInput(e) {
    this.setData({
      enContent: e.detail.value.trim()
    })
  },

  // 新增：单组词性输入绑定
  onPosInput(e) {
    this.setData({
      posContent: e.detail.value.trim()
    })
  },

  // 新增：单组释义输入绑定
  onZhInput(e) {
    this.setData({
      zhContent: e.detail.value.trim()
    })
  },

  // 例句输入绑定（不变）
  onExampleInput(e) {
    this.setData({
      exampleContent: e.detail.value
    })
  },

  // 知识库勾选（不变）
  handleLibraryCheck(e) {
    this.setData({
      checkedLibraryIds: e.detail.value
    })
  },

  // 提交逻辑（核心修改：单字段存储+取消去重）
  onSubmit() {
    const { enContent, posContent, zhContent, exampleContent, checkedLibraryIds } = this.data
    
    // 步骤1：校验（简化为单组词性+释义）
    if (!enContent || !posContent || !zhContent || checkedLibraryIds.length === 0) {
      wx.showToast({
        title: '请填写英文、词性、释义并选择知识库',
        icon: 'none'
      })
      return
    }

    // 步骤2：提交知识点（取消去重，直接新增）
    wx.showLoading({ title: '提交中...' })
    db.collection('knowledge_items')
      .add({
        data: {
          en: enContent,
          pos: posContent,   // 单组词性字段
          zh: zhContent,     // 单组释义字段
          example: exampleContent,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        const itemId = res._id //插入知识点返回的id
        // 步骤3：创建关联记录
        return this.createRelationRecords(itemId, checkedLibraryIds)
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '提交成功', icon: 'success' })
        // 清空表单
        this.setData({
          enContent: '',
          posContent: '',
          zhContent: '',
          exampleContent: '',
          checkedLibraryIds: []
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '提交失败', icon: 'none' })
        console.error('提交知识点失败：', err)
      })
  },

  // 创建关联记录（逻辑不变）
  createRelationRecords(itemId, libraryIds) {
    const promiseList = libraryIds.map(libraryId => {
      return db.collection('item_set_relations').add({
        data: {
          itemId: itemId,
          setId: libraryId,
          setType: 'library',
          reviewCount: 0,
          mastery: 0,
          lastReviewTime: null
        }
      })
    })
    return Promise.all(promiseList)
      .then(resList => {
        console.log('关联记录创建成功：', resList)
        return resList
      })
      .catch(err => {
        console.error('创建关联记录失败：', err)
        throw err
      })
  }
})