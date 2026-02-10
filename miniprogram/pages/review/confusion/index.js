// pages/review/confusion/index.js
const db = wx.cloud.database();
Page({
  data: {
    libraryId: '',
    libraryName: '',
    confusionList: [],  // 混淆组（5个英文单词）
    userAnswers: {},    // 用户答案：{单词1: 答案1, 单词2: 答案2...}
    isCheck: false,     // 是否核对答案
    correctCount: 0,    // 正确数量
    totalCount: 0,      // 总数量
    isLoading: true     // 加载状态
  },

  onLoad(options) {
    const { libraryId, libraryName } = options;
    this.setData({ libraryId, libraryName });
    wx.setNavigationBarTitle({ title: `${libraryName} - 混淆自测` });
    this.getConfusionList(libraryId);
  },

  /**
   * 查询知识点并生成混淆组（适配新结构）
   */
  getConfusionList(libraryId) {
    wx.showLoading({ title: '加载混淆题库...' });
    db.collection('item_set_relations')
      .where({ setId: libraryId, setType: 'library' })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          wx.hideLoading();
          this.setData({ isLoading: false });
          wx.showToast({ title: '暂无混淆自测内容', icon: 'none' });
          return;
        }
        const itemIds = res.data.map(item => item.itemId);
        return db.collection('knowledge_items').where({
          _id: db.command.in(itemIds)
        }).get();
      })
      .then(res => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        if (res) {
          const itemList = res.data;
          // 生成混淆组（取前5个，不足则取全部）
          const confusionList = itemList.slice(0, 5).map(item => ({
            en: item.en,
            zh: item.zh // 正确中文释义（新结构）
          }));
          this.setData({
            confusionList,
            totalCount: confusionList.length,
            userAnswers: {}
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showToast({ title: '加载题库失败', icon: 'none' });
        console.error('加载题库失败：', err);
      });
  },

  /**
   * 输入单个单词的答案
   */
  inputAnswer(e) {
    const { en } = e.currentTarget.dataset;
    const value = e.detail.value.trim();
    const { userAnswers } = this.data;
    userAnswers[en] = value;
    this.setData({ userAnswers });
  },

  /**
   * 核对所有答案
   */
  checkAllAnswer() {
    const { confusionList, userAnswers } = this.data;
    let correctCount = 0;

    confusionList.forEach(item => {
      const userAnswer = userAnswers[item.en] || '';
      const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
      if (normalize(userAnswer) === normalize(item.zh)) {
        correctCount++;
      }
    });

    this.setData({
      isCheck: true,
      correctCount
    });
  },

  /**
   * 重新自测
   */
  restartReview() {
    this.getConfusionList(this.data.libraryId);
    this.setData({
      userAnswers: {},
      isCheck: false,
      correctCount: 0
    });
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});