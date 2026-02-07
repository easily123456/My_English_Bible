// pages/library/index.js
// 初始化云数据库（若app.js已初始化，可省略wx.cloud.init）

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
    // 加载提示：让用户感知正在加载数据
    wx.showLoading({
      title: '加载知识点中...',
      mask: true // 用于控制是否显示透明蒙层，防止用户触摸屏幕时触发其他操作
    });

    // 1. 查询knowledge_items集合的所有数据
    db.collection('knowledge_items')
      .orderBy('createTime', 'desc') // 按创建时间倒序（最新的在最前面）
      .get({
        success: (res) => {
          // 2. 查询成功：更新data中的列表数据
          this.setData({
            knowledgeList: res.data // res.data是查询到的知识点数组
          });
          // 关闭加载提示
          wx.hideLoading();
          // 无数据时提示
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
   * @param {Object} e - 事件对象，携带知识点ID
   */
  goToDetail(e) {
    // 获取点击项的知识点ID（从data中取，或从e.currentTarget.dataset中取）
    const knowledgeId = e.currentTarget.dataset.id;
    // e.currentTarget：指向触发事件的组件（即被点击的 view）
    // dataset.id：读取组件上通过 data-id 属性绑定的数据，如<view data-id="123">其data-id为123
    // 跳转到详情页，并传递ID参数
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?id=${knowledgeId}`
    });
  },

  /**
   * 生命周期函数--监听页面下拉刷新
   * 下拉刷新重新加载列表（可选，提升体验）
   */
  onPullDownRefresh() {
    // 重新调用onLoad的查询逻辑
    this.onLoad();
    // 停止下拉刷新动画
    wx.stopPullDownRefresh();
  }
});