// pages/search/index.js
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    keyword: '',        // 搜索关键字
    resultList: [],     // 最终搜索结果
    isLoading: false    // 加载状态
  },

  /**
   * 监听搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword });

    // 关键字为空时清空结果
    if (!keyword) {
      this.setData({ resultList: [] });
      return;
    }

    // 触发搜索（防抖处理，避免频繁请求）
    clearTimeout(this.searchTimer);       //清空原本的定时器
    this.searchTimer = setTimeout(() => {
      this.searchKnowledge(keyword);
    }, 300);
    //延迟300毫秒再触发
  },

  /**
   * 核心逻辑：搜索指定四类集合的知识点
   */
  async searchKnowledge(keyword) {
    this.setData({ isLoading: true });

    try {
      // 步骤1：定义需要搜索的四类知识库类型（根据实际业务调整名称）
      const targetLibraryTypes = [
        // 'single_en2zh',   // 单词集合（英译中）
        // 'single_zh2en',   // 单词集合（中译英）
        // 'collection',     // 词组集合
        'confusion',       // 易混淆词汇
        'single'
      ];

      // 步骤2：先查询符合条件的知识库ID
      const libraryRes = await db.collection('libraries')
        .where({
          libraryType: _.in(targetLibraryTypes)
        })
        .get();
      const targetLibraryIds = libraryRes.data.map(library => library._id);

      if (targetLibraryIds.length === 0) {
        this.setData({ resultList: [], isLoading: false });
        return;
      }

      // 步骤3：查询关联表，获取四类知识库下的所有知识点ID
      const relationRes = await db.collection('item_set_relations')
        .where({
          setId: _.in(targetLibraryIds),
          setType: 'library'
        })
        .get();
      
      const targetItemIds = [...new Set(relationRes.data.map(item => item.itemId))]; // 去重
      //防止一个知识点绑定多个知识库，但最新的设计中，一个知识点绑定一个知识库，因此上述去重步骤多余，但予以保留


      if (targetItemIds.length === 0) {
        this.setData({ resultList: [], isLoading: false });
        return;
      }

      // 步骤4：根据英文关键字搜索知识点（仅匹配en字段）
      const knowledgeRes = await db.collection('knowledge_items')
        .where({
          _id: _.in(targetItemIds),
          en: db.RegExp({
            regexp: keyword,
            options: 'i' // 忽略大小写
          })
        })
        .get();

      // 步骤5：组装结果（补充来源信息+高亮关键字）
      const resultList = knowledgeRes.data.map(item => {
        // 匹配知识点所属的知识库（来源）
        const relation = relationRes.data.find(rel => rel.itemId === item._id);
        const library = libraryRes.data.find(lib => lib._id === relation?.setId);
        //find函数查找第一个满足条件的元素
        
        // 高亮关键字（替换为红色）
        const highlightEn = item.en.replace(
          new RegExp(keyword, 'gi'),
          match => `<span style="color:${'#1a7bff'}">${match}</span>`
        );
        //new RegExp(keyword, 'gi')意为构建一个关键字为keyword，匹配规则为全局匹配（g），忽略大小写（i）的正则表达式
        //match为匹配成功到的字段，并将其进行高亮后替换


        return {
          ...item,
          highlightEn,                                  // 高亮后的英文
          sourceName: library?.name || '未知来源',       // 知识点来源名称
          sourceType: library?.libraryType || ''               // 来源类型（用于跳转）

        };
      });

      // 步骤6：更新页面数据
      this.setData({
        resultList: resultList.sort((a, b) => a.en.localeCompare(b.en)), // 按英文排序
        isLoading: false
      });

    } catch (err) {
      console.error('搜索失败：', err);
      wx.showToast({ title: '搜索出错', icon: 'none' });
      this.setData({ resultList: [], isLoading: false });
    }
  },

  /**
   * 跳转知识点详情页
   */
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?id=${id}`
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
});