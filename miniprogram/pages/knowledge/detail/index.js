// pages/knowledge/detail/index.js
const db = wx.cloud.database()

Page({
  data: {
    currentEn: '',
    mergedKnowledgeList: [],
    isHighlight: false,
    isLoading: true,
    libraryMap: {}, // 缓存知识库名称映射，存有知识库id与知识库name，有知识点相关的知识库信息
    innerAudioContext: null, // 当前音频上下文
    isProcessingAudio: false // 是否正在处理音频请求
  },

  onLoad(options) {
    const { knowledgeId, highlight } = options;
    
    this.setData({ isHighlight: highlight === '1' });
    // console.log("miniprogram\pages\knowledge\detail\index.js文件下15行：输出传入的isHighlight值 "+this.data.isHighlight);
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
    if (!currentEn) return
    
    this.speakText(currentEn)
  },

  // 朗读例句
  readSentence(e) {
    const sentence = e.currentTarget.dataset.sentence
    if (!sentence) return
    
    this.speakText(sentence)
  },

  // 使用WechatSI插件进行语音合成
  speakText(text) {           //文字转语音
    // 如果正在处理音频请求，先取消
    if (this.data.isProcessingAudio) {
      console.log('取消正在处理的音频请求')
      this.stopAudio()
    }
    
    // 设置正在处理音频请求标志
    this.setData({ isProcessingAudio: true })
    
    const plugin = requirePlugin('WechatSI')      //动态引入已配置的插件，并返回插件暴露的接口对象
    
    plugin.textToSpeech({
      lang: 'en_US',        //语言类型，en_US为英文美式，zh_CN为中文普通话
      tts: true,
      content: text,        //待合成的文本
      success: (res) => {
        console.log('语音合成成功：', res)
        // 播放语音
        this.playAudio(res.filename)          //res.filename为临时存储文件地址
        // 重置标志位
        this.setData({ isProcessingAudio: false })
      },
      fail: (err) => {
        console.error('语音合成失败：', err)
        wx.showToast({ title: '朗读失败', icon: 'none' })
        // 重置标志位
        this.setData({ isProcessingAudio: false })
      }
    })
  },

  // 播放音频
  playAudio(audioUrl) {
    // 先停止并销毁现有的音频上下文
    this.stopAudio()
    
    // 创建新的音频上下文
    const innerAudioContext = wx.createInnerAudioContext()      //创建并控制一个音频上下文
    innerAudioContext.src = audioUrl
    innerAudioContext.title = '朗读'
    
    // 保存到data中
    this.setData({ innerAudioContext })
    
    // 播放
    innerAudioContext.play()
    
    // 监听播放结束
    innerAudioContext.onEnded(() => {
      console.log('播放结束')
      this.stopAudio() // 释放资源
    })
    
    // 监听错误
    innerAudioContext.onError((err) => {
      console.error('播放错误：', err)
      wx.showToast({ title: '播放失败', icon: 'none' })
      this.stopAudio() // 释放资源
    })
  },

  // 停止并销毁音频上下文
  stopAudio() {
    const { innerAudioContext } = this.data
    if (innerAudioContext) {
      try {
        innerAudioContext.stop()
        innerAudioContext.destroy()
      } catch (err) {
        console.error('停止音频失败：', err)
      } finally {
        this.setData({ innerAudioContext: null })
      }
    }
  }
})