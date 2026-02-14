// pages/template/create/index.js
const db = wx.cloud.database();

Page({
  data: {
    formData: { // 表单数据
      title: '',
      description: '',
      english: '',
      chinese: ''
    },
    isEdit: false, // 是否为编辑模式
    templateId: '', // 编辑模式下的模板ID
    isSubmitting: false // 提交状态锁
  },

  onLoad(options) {
    // 判断是否为编辑模式（传入id则为编辑）
    if (options.id) {
      this.setData({
        isEdit: true,
        templateId: options.id
      });
      // 加载现有模板数据
      this.getTemplateDetail(options.id);
      // 修改导航栏标题
      wx.setNavigationBarTitle({ title: '编辑作文模板' });
    }
  },

  /**
   * 编辑模式：加载模板详情
   */
  async getTemplateDetail(templateId) {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await db.collection('essay_templates').doc(templateId).get();
      this.setData({
        formData: {
          title: res.data.title || '',
          description: res.data.description || '',
          english: res.data.english || '',
          chinese: res.data.chinese || ''
        }
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载模板失败', icon: 'none' });
      console.error('加载模板详情失败：', err);
      // 编辑失败返回列表页
      wx.navigateBack();
    }
  },

  /**
   * 监听表单输入
   */
  inputChange(e) {
    const { key } = e.currentTarget.dataset;
    const value = e.detail.value.trim();
    const { formData } = this.data;
    formData[key] = value;
    this.setData({ formData });
  },

  /**
   * 提交表单（创建/编辑通用）
   */
  async submitForm(e) {
    const { formData, isEdit, templateId } = this.data;
    if (this.data.isSubmitting) return;

    // 表单验证
    if (!formData.title) {
      wx.showToast({ title: '请输入模板名', icon: 'none' });
      return;
    }
    if (!formData.english) {
      wx.showToast({ title: '请输入英文内容', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });

    try {
      if (isEdit) {
        // 编辑模式：执行update操作
        await db.collection('essay_templates').doc(templateId).update({
          data: {
            title: formData.title,
            description: formData.description,
            english: formData.english,
            chinese: formData.chinese
            // 不更新createTime，保留创建时间
          }
        });
        wx.showToast({ title: '修改成功', icon: 'success' });
      } else {
        // 创建模式：执行add操作
        await db.collection('essay_templates').add({
          data: {
            title: formData.title,
            description: formData.description,
            english: formData.english,
            chinese: formData.chinese,
            createTime: db.serverDate() // 新增创建时间
          }
        });
        wx.showToast({ title: '创建成功', icon: 'success' });
      }

      // 提交成功后返回列表页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1 // 返回上一级（列表页）
        });
      }, 1500);

    } catch (err) {
      this.setData({ isSubmitting: false });
      wx.showToast({ title: isEdit ? '修改失败' : '创建失败', icon: 'none' });
      console.error(`${isEdit ? '编辑' : '创建'}模板失败：`, err);
    }
  }
});