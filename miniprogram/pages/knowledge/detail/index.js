// pages/knowledge/detail/index.js

const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    knowledgeDetail: null, // 存储单个知识点详情，初始为空
    isLoading: true // 加载状态标识
  },

  /**
   * 生命周期函数--监听页面加载
   * 接收列表页传递的id，查询对应知识点详情
   */
  onLoad(options) {
    // 1. 获取URL传递的知识点ID
    const knowledgeId = options.id;
    if (!knowledgeId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        duration: 1500
      });
      // 无ID则返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 2. 加载提示
    wx.showLoading({
      title: '加载详情中...',
      mask: true
    });

    // 3. 查询单条知识点数据（doc(id)定位唯一记录）
    db.collection('knowledge_items')
      .doc(knowledgeId) // 通过ID精准查询
      .get({
        success: (res) => {
          // 4. 查询成功：更新数据，关闭加载
          this.setData({
            knowledgeDetail: res.data,
            isLoading: false
          });
          wx.hideLoading();
        },
        fail: (err) => {
          // 5. 查询失败：提示并返回上一页
          wx.hideLoading();
          wx.showToast({
            title: '详情加载失败',
            icon: 'none',
            duration: 2000
          });
          console.error('知识点详情查询失败：', err);
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
  },

  /**
   * 预留：朗读内容按钮事件（第13步集成TTS时补充）
   */
  // 用小程序内置API实现基础朗读
readContent() {
  wx.showToast({
    title: this.data.knowledgeDetail.content,
    icon: 'none',
    duration: 2000,
    // 开启语音朗读
    complete: () => {
      wx.setInnerAudioOption({
        obeyMuteSwitch: false
      });
    }
  });
},
  // readContent() {
  //   wx.showToast({
  //     title: '即将集成朗读功能',
  //     icon: 'none'
  //   });
  // },

  /**
   * 预留：朗读例句按钮事件（第13步集成TTS时补充）
   */
  readSentence() {
    wx.showToast({
      title: '即将集成朗读功能',
      icon: 'none'
    });
  }
});