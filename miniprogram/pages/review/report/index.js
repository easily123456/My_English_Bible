// pages/review/report/index.js
Page({
  data: {
    // 基础信息
    libraryId: '',
    libraryName: '',
    totalCount: 0,
    correctCount: 0,
    errorCount: 0,
    accuracyRate: 0, // 正确率（百分比）
    resultList: [],  // 详细结果列表
    isShowAnswer: {} // 控制正确题是否显示答案
  },

  onLoad(options) {
    try {
      // 1. 接收复习结果数据（URL传递的JSON字符串，需解码）
      const resultStr = decodeURIComponent(options.result || '');
      //decodeURICompnent解码 URI 的组件（如查询参数）
      if (!resultStr) {
        wx.showToast({ title: '暂无复习结果', icon: 'none' });
        return;
      }
      const reviewResult = JSON.parse(resultStr);
      //将符合 JSON 语法规则的字符串转换为 JavaScript 对象或值

      // 2. 计算正确率
      const accuracyRate = reviewResult.totalCount > 0 
        ? Math.round((reviewResult.correctCount / reviewResult.totalCount) * 100) 
        : 0;

      // 3. 更新页面数据
      this.setData({
        libraryId: reviewResult.libraryId,
        libraryName: reviewResult.libraryName,
        totalCount: reviewResult.totalCount,
        correctCount: reviewResult.correctCount,
        errorCount: reviewResult.errorCount,
        accuracyRate,
        resultList: reviewResult.resultList || [],
        isShowAnswer: {}
      });

    } catch (err) {
      wx.showToast({ title: '解析复习结果失败', icon: 'none' });
      console.error('复习报告解析失败：', err);
    }
  },

  /**
   * 切换正确题的答案显示状态
   */
  toggleShowAnswer(e) {
    const itemId = e.currentTarget.dataset.id;
    const { isShowAnswer } = this.data;
    isShowAnswer[itemId] = !isShowAnswer[itemId];
    this.setData({ isShowAnswer });
  },

  /**
   * 点击错误词条跳转到详情页
   */
  goToErrorDetail(e) {
    const itemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?knowledgeId=${itemId}&highlight=1` // 标记为错误知识点
    });
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    const { libraryId } = this.data;
    // wx.navigateTo({
    //   url: `/pages/library/detail/index?libraryId=${libraryId}`
    // });
    wx.switchTab({
      url: `/pages/library/index`
    });

    
  }
});