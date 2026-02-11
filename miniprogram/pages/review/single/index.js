// pages/review/single/index.js
const db = wx.cloud.database();
const _ = db.command; // 引入数据库操作符
Page({
  data: {
    // 基础参数
    libraryId: '',
    libraryName: '',
    reviewType: 'en2zh', // 默认英译中（可从知识库配置读取）
    
    // 组题相关
    reviewList: [],      // 最终复习列表（随机排序）
    currentIndex: 0,     // 当前复习索引
    currentItem: null,   // 当前复习知识点
    
    // 答题相关
    userAnswer: '',      // 用户默写答案
    isSubmitting: false, // 提交状态锁
    
    // 加载状态
    isLoading: true
  },

  onLoad(options) {
    // 1. 接收参数
    const { libraryId, libraryName } = options;
    this.setData({ libraryId, libraryName });
    wx.setNavigationBarTitle({ title: `${libraryName} - 单点复习` });

    // 2. 获取知识库配置（复习方向）
    this.getLibraryConfig(libraryId);
    // 3. 生成复习题库
    this.generateReviewList(libraryId);
  },

  /**
   * 步骤1：获取知识库配置（复习方向reviewType）
   */
  getLibraryConfig(libraryId) {
    db.collection('libraries')
      .doc(libraryId)
      .get()
      .then(res => {
        // 优先读取知识库配置的复习方向，无则默认en2zh
        const reviewType = res.data.reviewType == 'en_to_zh' ? 'en2zh' : 'zh2en';
        this.setData({ reviewType });
      })
      .catch(err => {
        console.error('获取知识库配置失败：', err);
      });
  },

  /**
   * 步骤2：核心算法 - 生成30词池复习列表
   */
  async generateReviewList(libraryId) {
    try {
      // 1. 查询关联表：获取该知识库的所有关联记录（含reviewCount/lastReviewTime/mastery）
      const relationRes = await db.collection('item_set_relations')
        .where({
          setId: libraryId,
          setType: 'library'
        })
        .get();

      if (relationRes.data.length === 0) {
        this.setData({ isLoading: false });
        wx.showToast({ title: '暂无复习内容', icon: 'none' });
        return;
      }

      const relationList = relationRes.data;
      const totalCount = relationList.length;

      // 2. 智能组题算法
      let finalItemIds = [];
      if (totalCount >= 30) {
        // 2.1 按lastReviewTime降序排序（最新复习的在前）
        const sortedByTime = [...relationList].sort((a, b) => {
          const timeA = a.lastReviewTime ? a.lastReviewTime.getTime() : 0;
          const timeB = b.lastReviewTime ? b.lastReviewTime.getTime() : 0;
          return timeB - timeA; // 降序
        });

        // 2.2 抽取前25个高频词
        const highFreqItems = sortedByTime.slice(0, 25);
        const highFreqIds = highFreqItems.map(item => item.itemId);
        finalItemIds = [...highFreqIds];

        // 2.3 移除已抽取的25个，剩余词按mastery升序（熟练度低的在前）
        const remainingItems = sortedByTime.slice(25);
        const sortedByMastery = [...remainingItems].sort((a, b) => {
          return (a.mastery || 0) - (b.mastery || 0); // 升序
        });

        // 2.4 抽取前5个低频词
        const lowFreqItems = sortedByMastery.slice(0, 5);
        const lowFreqIds = lowFreqItems.map(item => item.itemId);
        finalItemIds = [...finalItemIds, ...lowFreqIds];
      } else {
        // 知识点<30：全部纳入复习
        finalItemIds = relationList.map(item => item.itemId);
      }

      // 3. 查询知识点详情（新结构：en/pos/zh/example）
      const knowledgeRes = await db.collection('knowledge_items')
        .where({
          _id: _.in(finalItemIds)
        })
        .get();

      // 4. 关联知识点与关联记录（保留reviewCount/mastery等字段）
      const reviewList = knowledgeRes.data.map(knowledge => {
        const relation = relationList.find(item => item.itemId === knowledge._id);
        //find是在当前数组中寻找第一个与knowledge._id相同的记录，最终返回的是relationList的一条数据
        return {
          ...knowledge,
          relationId: relation._id,       // 关联记录ID（用于更新数据）
          reviewCount: relation.reviewCount || 0,
          mastery: relation.mastery || 0,
          lastReviewTime: relation.lastReviewTime || 0,
          setId:relation.setId,
          setType:relation.setType
        };
      });

      // 5. 随机打乱复习列表
      const shuffledList = this.shuffleArray(reviewList);

      // 6. 更新数据，加载第一个知识点
      this.setData({
        reviewList: shuffledList,
        currentItem: shuffledList[0] || null,
        isLoading: false
      });

    } catch (err) {
      this.setData({ isLoading: false });
      wx.showToast({ title: '生成题库失败', icon: 'none' });
      console.error('组题算法失败：', err);
    }
  },

  /**
   * 辅助函数：数组随机打乱（Fisher-Yates算法）
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
   * 输入默写答案
   */
  inputAnswer(e) {
    this.setData({ userAnswer: e.detail.value });
  },

  /**
   * 核心操作：点击“默写已完成”
   */
  async completeReview() {
    const { currentItem, userAnswer, reviewType } = this.data;
    if (!currentItem || this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });

    try {
      // 1. 判定答案是否正确（忽略大小写/空格/标点）
      const correctAnswer = reviewType === 'en2zh' ? currentItem.zh : currentItem.en;
      const isCorrect = this.checkAnswer(userAnswer, correctAnswer);
      // 2. 更新关联记录（reviewCount/lastReviewTime/mastery）
      await this.updateRelationRecord(currentItem.relationId, isCorrect);
      // console.log("miniprogram\pages\review\single\index.js文件第178行：输出当前判定答案是否正确 "+isCorrect);

      // 3. 判定结果处理
      if (!isCorrect) {
        // 错误：跳转到知识点详情页（标红提示）
        // console.log("miniprogram\pages\review\single\index.js文件第183行：输出当前判定答案是否正确 "+isCorrect);
        wx.navigateTo({
          url: `/pages/knowledge/detail/index?knowledgeId=${currentItem._id}&highlight=1` // 传递错误标记
        });
        // 详情页返回后自动下一题（通过onShow触发）
      } else {
        // 正确：直接下一题
        this.nextItem();
      }

    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
      console.error('复习提交失败：', err);
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 辅助函数：答案比对（容错处理）
   */
  checkAnswer(userAnswer, correctAnswer) {
    if (!userAnswer) return false; // 空答案判定为错误
    // 归一化处理：转小写、去空格、去标点
    const normalize = (str) => {
      return str.toLowerCase()
        .replace(/\s+/g, '')      //删去所有空白字符，如制表符、换行符
        .replace(/[，。！？；：""''()（）、]/g, '');    //删去标点符号
    };
    console.log("miniprogram\pages\review\single\index.js文件下第212行：输出checkAnswer情况")
    return normalize(userAnswer) === normalize(correctAnswer);
    //normalize标准化处理（转大小写，删不重要的字符等），将两者标准化处理后判断是否一致
  },

  /**
   * 步骤3：更新关联记录数据
   */
  async updateRelationRecord(relationId, isCorrect) {
    return db.collection('item_set_relations')
      .doc(relationId)
      .update({
        data: {
          reviewCount: _.inc(1), // 复习次数+1
          lastReviewTime: db.serverDate(), // 更新最后复习时间
          mastery: _.inc(isCorrect ? 1 : 0)  // 正确+1，错误则不变
        }
      });
  },

  /**
   * 自动下一题
   */
  nextItem() {
    const { reviewList, currentIndex } = this.data;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= reviewList.length) {
      // 复习完成
      this.setData({
        currentItem: null,
        userAnswer: ''
      });
      wx.showToast({ title: '复习完成！', icon: 'success' });
      return;
    }

    // 加载下一题
    this.setData({
      currentIndex: nextIndex,
      currentItem: reviewList[nextIndex],
      userAnswer: ''
    });
  },

  /**
   * 从详情页返回后自动下一题
   */
  onShow() {      //自动触发
    const { currentItem, reviewList, currentIndex } = this.data;
    // 若当前有知识点且用户从详情页返回（非初始加载）
    if (currentItem && currentIndex < reviewList.length - 1) {
      this.nextItem();
    }
  },

  /**
   * 返回知识库详情页
   */
  goBack() {
    wx.navigateBack();
  }
});