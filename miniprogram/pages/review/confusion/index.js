// pages/review/confusion/index.js
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    libraryId: '',
    libraryName: '',
    confusionList: [], // 打乱后的易混词列表
    userAnswers: {},   // 记录用户答案 {itemId: answer}
    isSubmitting: false // 提交状态锁
  },

  onLoad(options) {
    const { libraryId, libraryName } = options;
    this.setData({ libraryId, libraryName });
    // 获取并处理易混词列表
    this.getConfusionList(libraryId);
  },

  /**
   * 步骤1：获取混淆组合下的所有知识点并打乱顺序
   */
  async getConfusionList(libraryId) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 1. 查询关联表，获取该组合下的所有itemId
      const relationRes = await db.collection('item_set_relations')
        .where({
          setId: libraryId,
          setType: 'library'
        })
        .get();
      const itemIds = relationRes.data.map(item => item.itemId);

      if (itemIds.length === 0) {
        wx.hideLoading();
        wx.showToast({ title: '暂无易混词', icon: 'none' });
        wx.navigateBack();
        return;
      }

      // 2. 查询知识点详情
      const knowledgeRes = await db.collection('knowledge_items')
        .where({ _id: _.in(itemIds) })
        .get();

      // 3. 打乱顺序（Fisher-Yates算法，与单点复习复用）
      const shuffledList = this.shuffleArray(knowledgeRes.data);

      this.setData({ confusionList: shuffledList });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
      console.error('获取易混词失败：', err);
    }
  },

  /**
   * 辅助函数：数组打乱
   */
  shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },

  /**
   * 步骤2：记录用户输入的答案
   */
  inputAnswer(e) {
    const { id } = e.currentTarget.dataset;
    const value = e.detail.value.trim();
    const { userAnswers } = this.data;
    userAnswers[id] = value;
    this.setData({ userAnswers });
  },

  /**
   * 步骤3：提交答案（核心逻辑）
   */
  async submitAnswers() {
    const { confusionList, userAnswers, libraryId, libraryName } = this.data;
    if (this.data.isSubmitting) return;

    // 验证：至少填写一个答案（可选，根据需求调整）
    const hasAnswer = Object.values(userAnswers).some(v => v);
    //Object.values(userAnswers)返回 userAnswers 对象的所有属性值组成的数组
    //.some(v => v)对数组执行遍历，检查是否存在至少一个元素满足条件，等价于 v => Boolean(v) === true
    // if (!hasAnswer) {
    //   wx.showToast({ title: '请至少填写一个答案', icon: 'none' });
    //   return;
    // }

    this.setData({ isSubmitting: true });

    try {
      // 步骤1：组装报告数据（不判断对错，仅用于对照）
      const reviewResult = {
        libraryId,
        libraryName,
        totalCount: confusionList.length,
        correctCount: 0, // 混淆组合不统计对错
        errorCount: 0,
        resultList: confusionList.map(item => ({
          itemId: item._id,
          question: item.en, // 英文词作为题目
          userAnswer: userAnswers[item._id] || '',
          correctAnswer: item.zh, // 第一个释义作为正确答案
          isCorrect: null // 标记为null，报告页不标红/绿
        }))
      };

      // 步骤2：更新每个单词的复习记录（reviewCount+1，lastReviewTime更新）
      await this.updateReviewRecords(confusionList);

      // 步骤3：跳转报告页
      wx.navigateTo({
        url: `/pages/review/report/index?result=${encodeURIComponent(JSON.stringify(reviewResult))}`
      });

    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
      console.error('提交答案失败：', err);
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 步骤4：更新复习记录（T3-10）
   */
  async updateReviewRecords(confusionList) {
    try {
      const relationRes = await db.collection('item_set_relations')
      .where({
        setId: this.libraryId,
        setType: 'library'
      })
      .get();
      const updatePromises = relationRes.data.map(relation => 
        db.collection('item_set_relations').doc(relation._id).update({
          data: {
            reviewCount: _.inc(1),
            lastReviewTime: db.serverDate()
          }
        })
      );
      await Promise.all(updatePromises);
      console.log("批量更新成功");
    } catch (err) {
      console.error("批量更新失败", err);
    }
    



  }
});