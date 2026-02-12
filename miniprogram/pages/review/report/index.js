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
   * 核心功能：保存错题ID到缓存（支持错题再练）
   */
  saveErrorItems() {
    const { resultList, libraryId } = this.data;
    // 筛选错误的知识点ID
    const errorItemIds = resultList
      .filter(item => !item.isCorrect)
      .map(item => item.itemId);

    if (errorItemIds.length === 0) {
      wx.showToast({ title: '暂无错题', icon: 'none' });
      return;
    }

    // 方案1：保存到本地缓存（有效期持久）
    // wx.setStorageSync(`error_items_${libraryId}`, errorItemIds);

    // 方案2：保存到全局状态（可选，需在app.js配置）
    const app = getApp();     //获取app的实例
    if (app.globalData) {       
      app.globalData.errorItemIds = {     //直接赋值
        ...app.globalData.errorItemIds,
        [libraryId]: errorItemIds
      };
      //展开后，增设赋值libraryId再直接赋值
    }

    wx.showToast({ title: '错题已保存，下次优先复习', icon: 'success' });

    // 可选：直接跳转到错题再练页面
    // wx.navigateTo({
    //   url: `/pages/review/single/index?libraryId=${libraryId}&onlyError=1`
    // });
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});