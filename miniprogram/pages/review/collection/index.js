// pages/review/collection/index.js
const db = wx.cloud.database();
Page({
  data: {
    libraryId: '',
    libraryName: '',
    groupId: '',
    groupName: '',
    itemList: [],       // 所有知识点
    userAnswers: {},    // 用户输入的答案 {itemId: answer}
    showAnswers: {},    // 控制英文内容显示 {itemId: boolean}
    isSubmitting: false, // 提交状态锁
    isLoading: true     // 加载状态
  },

  onLoad(options) {
    const { libraryId, libraryName, groupId, groupName } = options;
    this.setData({ 
      libraryId, 
      libraryName, 
      groupId, 
      groupName 
    });
    wx.setNavigationBarTitle({ title: `${groupName || libraryName} - 集合自测` });
    this.getReviewItems(libraryId, groupId);
  },

  /**
   * 查询知识点（适配新结构）
   */
  getReviewItems(libraryId, groupId) {
    wx.showLoading({ title: '加载自测题库...' });
    
    // 根据是否有groupId决定查询条件
    const query = groupId 
      ? db.collection('item_set_relations').where({ groupId })
      : db.collection('item_set_relations').where({ setId: libraryId, setType: 'library' });
    
    query.get()
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
   * 输入答案
   */
  inputAnswer(e) {
    const { itemId } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    // 更新userAnswers对象
    const { userAnswers } = this.data;
    userAnswers[itemId] = value;
    this.setData({ userAnswers });
  },

  /**
   * 默写已完成按钮点击事件
   */
  completeReview() {
    this.setData({ isSubmitting: true });
    
    try {
      // 构建showAnswers对象，所有知识点都显示英文内容
      const { itemList } = this.data;
      const showAnswers = {};
      
      itemList.forEach(item => {
        showAnswers[item._id] = true;
      });
      
      // 更新数据，显示所有英文内容
      this.setData({ showAnswers });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
      console.error('操作失败：', err);
    } finally {
      // 延迟设置isSubmitting为false，防止连续点击
      setTimeout(() => {
        this.setData({ isSubmitting: false });
      }, 300);
    }
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});