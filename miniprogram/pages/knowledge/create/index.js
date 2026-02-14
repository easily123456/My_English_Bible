// pages/knowledge/create.js
const db = wx.cloud.database()
Page({
  data: {
    // 基础输入（简化为单字段）
    enContent: '',
    posContent: '',   // 单组词性
    zhContent: '',    // 单组释义
    exampleContent: '',
    // 知识库相关
    libraryList: [],
    selectedLibraryId: '', // 选中的知识库ID
    showGroupSelect: false, // 是否显示小组选择
    groupList: [], // 小组列表
    selectedGroupId: '' // 选中的小组ID
  },

  onLoad(options) {
    this.getLibraryList()
  },

  // 获取知识库列表（不变）
  getLibraryList() {
    wx.showLoading({ title: '加载知识库...' })
    db.collection('libraries')
      .get()
      .then(res => {
        wx.hideLoading()
        this.setData({
          libraryList: res.data
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '加载知识库失败',
          icon: 'none'
        })
        console.error('获取知识库列表失败：', err)
      })
  },

  // 英文输入绑定（不变）
  onEnInput(e) {
    this.setData({
      enContent: e.detail.value
    })
  },

  // 新增：单组词性输入绑定
  onPosInput(e) {
    this.setData({
      posContent: e.detail.value.trim()
    })
  },

  // 新增：单组释义输入绑定
  onZhInput(e) {
    this.setData({
      zhContent: e.detail.value.trim()
    })
  },

  // 例句输入绑定（不变）
  onExampleInput(e) {
    this.setData({
      exampleContent: e.detail.value
    })
  },

  // 知识库选择
  handleLibrarySelect(e) {
    const selectedLibraryId = e.detail.value
    this.setData({
      selectedLibraryId: selectedLibraryId,
      showGroupSelect: false,
      groupList: [],
      selectedGroupId: ''
    })
    
    // 检查是否选择了第4-6个知识库
    const selectedLibrary = this.data.libraryList.find(item => item._id === selectedLibraryId)
    if (selectedLibrary) {
      const libraryIndex = this.data.libraryList.indexOf(selectedLibrary)
      if (libraryIndex >= 3 && libraryIndex <= 5) { // 第4-6个知识库（索引3-5）
        this.setData({ showGroupSelect: true })
        this.getGroupsByLibrary(selectedLibraryId)
      }
    }
  },
  
  // 根据知识库获取小组列表
  getGroupsByLibrary(libraryId) {
    // 从真实的group数据表中获取小组列表，确保groupname不重复
    db.collection('groups')
      .where({ libraryId })
      .get()
      .then(res => {
        // 去重处理，确保groupname不重复
        const uniqueGroups = []
        const groupNames = new Set()
        
        res.data.forEach(group => {
          if (!groupNames.has(group.name)) {      
            groupNames.add(group.name)
            uniqueGroups.push(group)
          }
        })
        //groupNames作为集合只是用来去重

        this.setData({ groupList: uniqueGroups })
      })
      .catch(err => {
        console.error('获取小组列表失败：', err)
        this.setData({ groupList: [] })
      })
  },
  
  // 小组选择
  handleGroupSelect(e) {
    console.log("miniprogram\pages\knowledge\create\index.js文件第121行：输出进入handleGroupSelect函数");
    this.setData({ selectedGroupId: e.detail.value })
  },
  
  // 弹窗创建小组
  showCreateGroupDialog() {
    wx.showModal({        //显示一个带输入框的模态对话框
      title: '创建新小组',
      // content: '请输入小组名称',如 旅游相关
      editable: true,     //显示输入框
      placeholderText: '请输入小组名称',    
      success: (res) => {
        if (res.confirm && res.content) {
          //res.confirm表示用户是否点击了对话框的确认按钮
          //res.content表示用户在对话框输入框中输入的文本内容
          const groupName = res.content.trim()
          if (groupName) {
            this.createGroup(groupName)
          } else {
            wx.showToast({
              title: '小组名称不能为空',
              icon: 'none'
            })
          }
        }
      }
    })
  },
  
  // 创建小组
  createGroup(groupName) {
    const { selectedLibraryId } = this.data
    
    wx.showLoading({ title: '创建中...' })
    db.collection('groups')
      .add({
        data: {
          name: groupName,
          libraryId: selectedLibraryId,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '小组创建成功',
          icon: 'success'
        })
        // 重新获取小组列表
        this.getGroupsByLibrary(selectedLibraryId)
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '创建失败',
          icon: 'none'
        })
        console.error('创建小组失败：', err)
      })
  },

  // 提交逻辑（修改为单选逻辑）
  onSubmit() {
    const { enContent, posContent, zhContent, exampleContent, selectedLibraryId, selectedGroupId, showGroupSelect } = this.data
    
    // 步骤1：校验
    if (!enContent || !posContent || !zhContent || !selectedLibraryId) {
      wx.showToast({
        title: '请填写英文、词性、释义并选择知识库',
        icon: 'none'
      })
      return
    }
    
    console.log("miniprogram\pages\knowledge\create\index.js文件下第194行：输出showGroupSelect "+showGroupSelect+" 输出selectedGroupId " + selectedGroupId + " 输出结束");

    // 检查是否需要选择小组，直接利用showGroupSelect属性
    if (showGroupSelect && !selectedGroupId) {
      wx.showToast({
        title: '请选择小组',
        icon: 'none'
      })
      return
    }

    // 步骤2：提交知识点
    wx.showLoading({ title: '提交中...' })
    db.collection('knowledge_items')
      .add({
        data: {
          en: enContent,
          pos: posContent,   // 单组词性字段
          zh: zhContent,     // 单组释义字段
          example: exampleContent,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        const itemId = res._id //插入知识点返回的id
        // 步骤3：创建关联记录
        return this.createRelationRecords(itemId, selectedLibraryId, selectedGroupId)
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '提交成功', icon: 'success' })
        // 清空表单
        this.setData({
          enContent: '',
          posContent: '',
          zhContent: '',
          exampleContent: '',
          selectedLibraryId: '',
          showGroupSelect: false,
          groupList: [],
          selectedGroupId: ''
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '提交失败', icon: 'none' })
        console.error('提交知识点失败：', err)
      })
  },

  // 创建关联记录（修改为支持单个知识库和小组）
  createRelationRecords(itemId, libraryId, groupId) {
    return db.collection('item_set_relations').add({
      data: {
        itemId: itemId,
        setId: libraryId,
        setType: 'library',
        groupId: groupId || null, // 添加小组字段
        reviewCount: 0,
        mastery: 0,
        lastReviewTime: null
      }
    })
    .then(res => {
      console.log('关联记录创建成功：', res)
      return res
    })
    .catch(err => {
      console.error('创建关联记录失败：', err)
      throw err
    })
  }
})