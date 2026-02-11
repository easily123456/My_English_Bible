// pages/knowledge/list.js
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    knowledgeList: [] // 存储知识点列表数据，初始为空
  },

  /**
   * 生命周期函数--监听页面加载
   * 页面加载时自动查询数据库，获取所有知识点
   */
  onLoad(options) {
    // 加载提示
    wx.showLoading({
      title: '加载知识点中...',
      mask: true
    });

    // 1. 查询knowledge_items集合的所有数据（适配新字段）
    db.collection('knowledge_items')
      .orderBy('createTime', 'desc') // 按创建时间倒序
      .get({
        success: (res) => {
          // 2. 查询成功：更新列表数据
          this.setData({
            knowledgeList: res.data
          });
          wx.hideLoading();
          // 无数据提示
          if (res.data.length === 0) {
            wx.showToast({
              title: '暂无知识点',
              icon: 'none',
              duration: 1500
            });
          }
        },
        fail: (err) => {
          // 3. 查询失败：提示错误
          wx.hideLoading();
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none',
            duration: 2000
          });
          console.error('知识点列表查询失败：', err);
        }
      });
  },

  /**
   * 点击列表项跳转详情页
   */
  goToDetail(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?knowledgeId=${knowledgeId}`
    });
  },

  /**
   * 下拉刷新重新加载列表
   */
  onPullDownRefresh() {
    this.onLoad();
    wx.stopPullDownRefresh();
  },

  /**
   * 格式化创建时间（小程序WXML中调用的方法）
   */
  formatCreateTime(createTime) {
    if (!createTime) return '未知时间';
    // 兼容云数据库时间格式和普通时间戳
    const time = createTime instanceof Date ? createTime : new Date(createTime);
    return `${time.getFullYear()}-${(time.getMonth()+1).toString().padStart(2, '0')}-${time.getDate().toString().padStart(2, '0')}`;
  }
});