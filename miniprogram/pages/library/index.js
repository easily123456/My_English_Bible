// pages/library/index.js

const db = wx.cloud.database();

Page({
  data: {
    knowledgeList: [], // 原有知识点列表（若需要保留）
    // 新增：7个静态知识库名称
    libraryList: [
      { name: "单词集合（英译中）" },
      { name: "单词集合（中译英）" },
      { name: "词组大全" },
      { name: "功能句型" },
      { name: "作文高级词汇" },
      { name: "易混淆词汇" },
      { name: "作文模板" }
    ]
  },

  // 原有onLoad逻辑（查询知识点列表，可保留）
  onLoad(options) {
    // 若不需要显示知识点列表，可注释此段，仅展示静态知识库卡片
    wx.showLoading({ title: '加载中...', mask: true });
    db.collection('knowledge_items')
      .orderBy('createTime', 'desc')
      .get({
        success: (res) => {
          this.setData({ knowledgeList: res.data });
          wx.hideLoading();
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('查询失败：', err);
        }
      });
  },

  // 预留：点击知识库卡片跳转详情（后续可完善）
  goToLibraryDetail(e) {
    const library = e.currentTarget.dataset.library;
    wx.showToast({
      title: `进入${library.name}`,
      icon: 'none'
    });
  },

  // 原有goToDetail、onPullDownRefresh等逻辑（保留）
  goToDetail(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?id=${knowledgeId}`
    });
  },
  onPullDownRefresh() {
    this.onLoad();
    wx.stopPullDownRefresh();
  }
});