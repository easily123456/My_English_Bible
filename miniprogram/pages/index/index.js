// pages/index/index.js
// 初始化云数据库（app.js已初始化可省略）
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    knowledgeCount: 0 // 知识点总数，初始为0
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时（如从创建页返回），重新统计知识点总数
   */
  onShow() {
    // 加载提示
    wx.showLoading({
      title: '加载数据中...',
      mask: true
    });

    // 1. 查询知识点总数（count()方法只返回数量，不返回具体数据，效率更高）
    db.collection('knowledge_items')
      .count({
        success: (res) => {
          // 2. 更新知识点总数到页面
          this.setData({
            knowledgeCount: res.total // res.total是统计的总数
          });
          wx.hideLoading();
        },
        fail: (err) => {
          // 3. 查询失败：提示并默认显示0
          wx.hideLoading();
          wx.showToast({
            title: '数据加载失败',
            icon: 'none',
            duration: 1500
          });
          console.error('知识点总数统计失败：', err);
        }
      });
  },

  /**
   * 点击“创建知识点”按钮，跳转到创建页
   */
  goToCreate() {
    
    // wx.navigateTo({
    //   url: `/pages/knowledge/create/index` // 跳转到创建知识点页面
    // });
    wx.navigateTo({
      url: '/pages/knowledge/create/index' // 仅当它是 tabBar 页面时
    });
    
    // console.log('点击了创建知识点按钮'); 
  },

  /**
   * 点击“继续复习”按钮，跳转到复习页（暂固定跳转）
   */
  goToReview() {
    // 暂固定跳转到library/review页面，后续阶段二完善动态跳转逻辑
    // wx.navigateTo({
    //   url: '/pages/library/review/index' // 复习页路径，需确保目录已创建
    // });
    // 可选：若复习页未创建，先提示
    wx.showToast({
      title: '复习功能即将上线',
      icon: 'none'
    });
  },
  // 新增跳转搜索页方法
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  }
});