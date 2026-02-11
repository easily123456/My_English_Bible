// pages/knowledge/detail/index.js
const db = wx.cloud.database()

Page({
  data: {
    currentEn: '',
    mergedKnowledgeList: [],
    isHighlight: false,
    isLoading: true,
    libraryMap: {} // 缓存知识库名称映射，存有知识库id与知识库name，有知识点相关的知识库信息
  },

  onLoad(options) {
    const { knowledgeId, highlight } = options;
    
    this.setData({ isHighlight: highlight === '1' });
    console.log("miniprogram\pages\knowledge\detail\index.js文件下15行：输出传入的isHighlight值 "+this.data.isHighlight);
    if (!knowledgeId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    wx.showLoading({ title: '加载详情中...', mask: true })
    this.loadKnowledgeAndRelations(knowledgeId)
  },

  // 加载当前知识点并关联所有同英文的知识点
  async loadKnowledgeAndRelations(knowledgeId) {
    try {
      // 1. 获取当前知识点详情
      const currentRes = await db.collection('knowledge_items').doc(knowledgeId).get()
      const currentEn = currentRes.data.en
      this.setData({ currentEn })

      // 2. 查询所有同英文的知识点
      const sameEnRes = await db.collection('knowledge_items')
        .where({ en: currentEn })
        .get()
      const sameEnList = sameEnRes.data 

      // 3. 批量获取所有关联的记录
      const allItemIds = sameEnList.map(item => item._id)
      const relationsRes = await db.collection('item_set_relations')
        .where({ itemId: db.command.in(allItemIds), setType: 'library' })
        .get()

      // 4. 缓存所有知识库名称
      const libraryIds = [...new Set(relationsRes.data.map(r => r.setId))]
      //relationsRes遍历提取setId属性，并用以创建Set集合，展开后赋值给libraryIds
      //libraryIds是知识点所存的知识库列表
      const libraryRes = await db.collection('libraries')
        .where({ _id: db.command.in(libraryIds) })
        .get()
      //libraryRes是libraries对应的记录集合
    
      const libraryMap = {}
      libraryRes.data.forEach(lib => libraryMap[lib._id] = lib.name)
      //forEach也是遍历数组并执行回调函数，并且其不会生成新的数组，map会产生新的数组
      this.setData({ libraryMap })

      // 5. 合并知识点与知识库信息
      const mergedList = sameEnList.map(item => {
        // 找到该知识点对应的知识库名称
        const relation = relationsRes.data.find(r => r.itemId === item._id)
        return {
          ...item,
          libraryName: relation ? libraryMap[relation.setId] : '未知知识库'
        }
      })
      //这一步是将 在knowledge_items中与currentEn相关的记录集合 与 在item_set_relations中与currentEn相关的记录集合 的知识点id进行比较，若比较相同则再比较知识库id，如果不同则归为“未知知识库”

      this.setData({
        mergedKnowledgeList: mergedList,
        isLoading: false
      })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
      console.error('合并知识点加载失败：', err)
      setTimeout(() => wx.navigateBack(), 2000)
    }
  },

  // 朗读当前英文单词
  readCurrentEn() {
    const { currentEn } = this.data
    wx.showToast({ title: `朗读：${currentEn}`, icon: 'none' })
    // 后续可集成TTS API：wx.showToast只是临时占位
  },

  // 朗读例句
  readSentence(e) {
    const sentence = e.currentTarget.dataset.sentence
    wx.showToast({ title: `朗读例句：${sentence}`, icon: 'none' })
    // 后续可集成TTS API
  }
})