// pages/library/index.js
const db = wx.cloud.database()
Page({
  data: {
    libraryList: [
      { name: "单词集合（英译中）" },
      { name: "单词集合（中译英）" },
      { name: "词组大全" },
      { name: "功能句型" },
      { name: "作文高级词汇" },
      { name: "易混淆词汇" },
      { name: "作文模板" }
    ] // 知识库列表
  },

  // 页面加载时获取所有知识库
  onLoad(options) {
    this.getLibraryList()
  },

  // 下拉刷新重新加载
  onPullDownRefresh() {
    this.getLibraryList(() => { //先执行getLibraryList再执行stopPullDownRefresh
      wx.stopPullDownRefresh()  //停止当前页面的下拉刷新动画
    })
  },

  // 获取知识库列表（复用之前的逻辑，增加回调）
  getLibraryList(callback) {
    wx.showLoading({ title: '加载知识库...' })
    db.collection('libraries')
      .get()
      .then(res => {
        wx.hideLoading()
        this.setData({ libraryList: res.data })
        callback && callback()  //确认callback是否存在，若存在则执行callback()函数
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error('获取知识库列表失败：', err)
        callback && callback()
      })
  },

  // 跳转到知识库详情页
  goToDetail(e) {
    // console.log("进入跳转知识库详情页")
    const { libraryId, libraryName } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/library/detail/index?libraryId=${libraryId}&libraryName=${libraryName}`
    })
  },
    // 新增：跳转到作文模板列表页
    goToEssayTemplateList() {
      wx.navigateTo({
        url: '/pages/template/list/index'
      })
    }
})