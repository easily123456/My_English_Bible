// pages/template/detail/index.js
const db = wx.cloud.database();

Page({
  data: {
    templateId: '',
    templateInfo: null, // 模板详情数据
    isLoading: true     // 加载状态
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '模板ID不能为空', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ templateId: id });
    // 获取模板详情
    this.getTemplateDetail();

  },

  /**
   * 下拉刷新重新加载
   */
  onPullDownRefresh() {
    this.getTemplateDetail(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 获取模板详情（核心逻辑）
   */
  async getTemplateDetail(callback) {
    const { templateId } = this.data;
    try {
      wx.showLoading({ title: '加载中...' });
      // 查询指定ID的模板
      const res = await db.collection('essay_templates').doc(templateId).get();
      this.setData({
        templateInfo: res.data,
        isLoading: false
      });
      // console.log("createTime 类型:", typeof res.data.createTime, res.data.createTime);

      // console.log(this.data.templateInfo.createTime);
      wx.hideLoading();
      callback && callback();
    } catch (err) {
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
      console.error('获取模板详情失败：', err);
      callback && callback();
    }
  },


  /**
   * 跳转编辑页（携带模板ID）
   */
  goToEdit() {
    const { templateInfo } = this.data;
    wx.navigateTo({
      url: `/pages/template/create/index?id=${templateInfo._id}`
    });
  },

  /**
   * 返回模板列表页
   */
  goBack() {
    wx.navigateBack();
  }
});