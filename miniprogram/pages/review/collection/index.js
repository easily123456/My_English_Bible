// pages/review/collection/index.js
const db = wx.cloud.database();
Page({
  data: {
    libraryId: '',
    libraryName: '',
    itemList: [],       // 所有知识点
    currentQuestion: '',// 当前题目（随机抽取的英文/中文）
    currentAnswer: '',  // 正确答案
    userAnswer: '',     // 用户输入的答案
    isCheck: false,     // 是否已核对答案
    isCorrect: false,   // 答案是否正确
    isLoading: true     // 加载状态
  },

  onLoad(options) {
    const { libraryId, libraryName } = options;
    this.setData({ libraryId, libraryName });
    wx.setNavigationBarTitle({ title: `${libraryName} - 集合自测` });
    this.getReviewItems(libraryId);
  },

  /**
   * 查询知识点（适配新结构）
   */
  getReviewItems(libraryId) {
    wx.showLoading({ title: '加载自测题库...' });
    db.collection('item_set_relations')
      .where({ setId: libraryId, setType: 'library' })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          wx.hideLoading();
          this.setData({ isLoading: false });
          wx.showToast({ title: '暂无自测内容', icon: 'none' });
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
          this.setData({ itemList });
          // 随机生成第一道题
          this.generateQuestion();
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
   * 随机生成题目（自由默写）
   */
  generateQuestion() {
    const { itemList } = this.data;
    if (itemList.length === 0) return;

    // 随机选一个知识点
    const randomItem = itemList[Math.floor(Math.random() * itemList.length)];
    // 随机决定题目类型（英译中/中译英）
    const isEn2Zh = Math.random() > 0.5;
    
    this.setData({
      currentQuestion: isEn2Zh ? randomItem.en : randomItem.zh,
      currentAnswer: isEn2Zh ? randomItem.zh : randomItem.en,
      userAnswer: '',
      isCheck: false,
      isCorrect: false
    });
  },

  /**
   * 输入答案
   */
  inputAnswer(e) {
    this.setData({ userAnswer: e.detail.value.trim() });
  },

  /**
   * 核对答案（忽略大小写/空格）
   */
  checkAnswer() {
    const { userAnswer, currentAnswer } = this.data;
    if (!userAnswer) {
      wx.showToast({ title: '请先输入答案', icon: 'none' });
      return;
    }

    const normalize = (str) => str.toLowerCase().replace(/\s+/g, '');
    const isCorrect = normalize(userAnswer) === normalize(currentAnswer);
    
    this.setData({
      isCheck: true,
      isCorrect
    });
  },

  /**
   * 下一题
   */
  nextQuestion() {
    this.generateQuestion();
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});