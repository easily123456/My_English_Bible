// pages/review/start/index.js
Page({
  data: {
    libraryId: '',      // 知识库ID
    libraryType: '',    // 知识库类型（single/collection/confusion）
    libraryName: ''     // 知识库名称
  },

  onLoad(options) {
    // 1. 接收从知识库详情页传入的参数
    const { libraryId, libraryType, libraryName } = options;
    this.setData({ libraryId, libraryType, libraryName });

    // 2. 参数校验
    if (!libraryId || !libraryType) {
      wx.showToast({ title: '复习参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }

    // 3. 根据libraryType自动重定向到对应复习页
    this.redirectToReviewPage();
  },

  /**
   * 复习页面重定向核心逻辑（路由器）
   */
  redirectToReviewPage() {
    wx.showLoading({ title: '加载复习内容...' });

    setTimeout(() => {
      wx.hideLoading();
      let targetUrl = '';
      const { libraryId, libraryName } = this.data;

      // 根据类型拼接跳转URL
      switch (this.data.libraryType) {
        case 'single':
          targetUrl = `/pages/review/single/index?libraryId=${libraryId}&libraryName=${libraryName}`;
          break;
        case 'collection':
          targetUrl = `/pages/review/collection/index?libraryId=${libraryId}&libraryName=${libraryName}`;
          break;
        case 'confusion':
          targetUrl = `/pages/review/confusion/index?libraryId=${libraryId}&libraryName=${libraryName}`;
          break;
        default:
          wx.showToast({ title: '暂不支持该复习类型', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1000);
          return;
      }

      // 跳转到目标复习页
      wx.redirectTo({
        url: targetUrl,
        fail: (err) => {
          wx.showToast({ title: '跳转复习页失败', icon: 'none' });
          console.error('复习页跳转失败：', err);
        }
      });
    }, 800); // 模拟加载延迟，提升体验
  }
});