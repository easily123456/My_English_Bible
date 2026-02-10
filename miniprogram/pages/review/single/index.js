// pages/review/single/index.js
const db = wx.cloud.database();
Page({
  data: {
    libraryId: '',
    libraryName: '',
    itemList: [],       // 该知识库下的所有知识点
    currentItem: null,  // 当前复习的知识点
    currentType: 'en2zh', // 复习类型：en2zh(英译中)/zh2en(中译英)
    userAnswer: '',     // 用户输入的答案
    isShowAnswer: false, // 是否显示正确答案
    isLoading: true     // 加载状态
  },

  onLoad(options) {
    const { libraryId, libraryName } = options;
    this.setData({ libraryId, libraryName });
    // 设置页面标题
    wx.setNavigationBarTitle({ title: `${libraryName} - 单点复习` });
    // 查询复习知识点
    this.getReviewItems(libraryId);
  },

  /**
   * 查询该知识库下的所有知识点（适配新结构）
   */
  getReviewItems(libraryId) {
    wx.showLoading({ title: '加载复习题库...' });
    // 步骤1：查关联表获取itemId
    db.collection('item_set_relations')
      .where({ setId: libraryId, setType: 'library' })
      .get()
      .then(res => {
        if (res.data.length === 0) {
          wx.hideLoading();
          this.setData({ isLoading: false });
          wx.showToast({ title: '暂无复习内容', icon: 'none' });
          return;
        }
        const itemIds = res.data.map(item => item.itemId);
        // 步骤2：查知识点详情（新结构：en/pos/zh/example）
        return db.collection('knowledge_items').where({
          _id: db.command.in(itemIds)
        }).get();
      })
      .then(res => {
        wx.hideLoading();
        this.setData({ isLoading: false });
        if (res) {
          const itemList = res.data;
          this.setData({ 
            itemList,
            currentItem: itemList[0] // 默认加载第一个知识点
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
   * 切换复习类型
   */
  switchReviewType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 
      currentType: type,
      userAnswer: '',
      isShowAnswer: false
    });
  },

  /**
   * 输入答案
   */
  inputAnswer(e) {
    this.setData({ userAnswer: e.detail.value.trim() });
  },

  /**
   * 查看答案
   */
  showAnswer() {
    this.setData({ isShowAnswer: true });
  },

  /**
   * 下一题
   */
  nextItem() {
    const { itemList, currentItem } = this.data;
    if (!currentItem) return;

    const currentIndex = itemList.findIndex(item => item._id === currentItem._id);
    if (currentIndex >= itemList.length - 1) {
      wx.showToast({ title: '已复习完所有内容', icon: 'success' });
      return;
    }

    this.setData({
      currentItem: itemList[currentIndex + 1],
      userAnswer: '',
      isShowAnswer: false
    });
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});