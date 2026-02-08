// pages/knowledge/create.js
const db = wx.cloud.database()
Page({
  data: {
    // 基础输入
    enContent: '',
    exampleContent: '',
    // 词性-释义数组（核心：绑定关系）
    posZhList: [{ pos: '', zh: '' }], // 初始1行
    //pos为词性，zh为中文释义
    // 知识库相关
    libraryList: [],
    checkedLibraryIds: [] //存储用户勾选的知识库 ID 数组
  },

  onLoad(options) {//首次加载页面调用
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
      // console.log("libraryList:", this.data.libraryList);
      // console.log("正在查询知识库列表")
  },

  // 英文输入绑定
  onEnInput(e) {
    this.setData({
      enContent: e.detail.value.trim()
    })
  },

  // 新增：词性输入绑定（指定index）
  onPosInput(e) {
    const index = e.currentTarget.dataset.index 
    //e.currentTarget表示触发事件的当前组件，dataset自定义数据集合，通过 data- 前缀的属性绑定
    const value = e.detail.value.trim()
    const posZhList = [...this.data.posZhList]
    posZhList[index].pos = value
    this.setData({ posZhList })
  },

  // 新增：释义输入绑定（指定index）
  onZhItemInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value.trim()
    const posZhList = [...this.data.posZhList]
    posZhList[index].zh = value
    this.setData({ posZhList })
  },

  // 新增：添加一行词性-释义
  onAddPosZh() {
    const posZhList = [...this.data.posZhList]
    posZhList.push({ pos: '', zh: '' })
    this.setData({ posZhList })
  },

  // 新增：删除指定行词性-释义
  onDelPosZh(e) {
    const index = e.currentTarget.dataset.index
    const posZhList = [...this.data.posZhList]
    // 至少保留1行
    if (posZhList.length <= 1) {
      wx.showToast({
        title: '至少保留1个词性-释义',
        icon: 'none'
      })
      return
    }
    posZhList.splice(index, 1)
    //splice(arg1,arg2) arg1为删除的起始位置，arg2为删除的数量
    this.setData({ posZhList })
  },

  // 新增：例句输入绑定
  onExampleInput(e) {
    this.setData({
      exampleContent: e.detail.value
    })
  },

  // 知识库多选框处理（不变）
  // onLibraryCheck(e) {
  //   console.log("使用onLibraryCheck函数")
  //   const libraryId = e.currentTarget.dataset.libraryId
  //   const checked = e.detail.value.length > 0
  //   let checkedLibraryIds = [...this.data.checkedLibraryIds]
  //   //let意为后续可能重新赋值

  //   if (checked) {
  //     if (!checkedLibraryIds.includes(libraryId)) {   //如果原本就包含了被勾选的选择项，那么本次就不再添加
  //       checkedLibraryIds.push(libraryId)
  //     }
  //   } else {
  //     checkedLibraryIds = checkedLibraryIds.filter(id => id !== libraryId)
  //     //filter遍历原数组，判断传入id与遍历到的libraryId是否一致，不一致则保留，否则删去。filter返回的是一个新数组
  //   }

  //   this.setData({ checkedLibraryIds })
    
  // },

    handleLibraryCheck(e) {
      // 直接把选中的ID数组存到data里，提交时直接用
      this.setData({
        checkedLibraryIds: e.detail.value
      })
    },

  // 提交逻辑（更新：包含词性-释义、例句）
  onSubmit() {
    const { enContent, posZhList, exampleContent, checkedLibraryIds } = this.data
    
    // 步骤1：校验（直接用存储的选中值）
    const hasValidPosZh = posZhList.some(item => item.pos && item.zh)
    // console.log(enContent)
    // console.log(hasValidPosZh)
    // console.log(checkedLibraryIds.length)
    if (!enContent || !hasValidPosZh || checkedLibraryIds.length === 0) {
      wx.showToast({
        title: '请填写英文、完整的词性-释义并选择知识库',
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
          posZh: posZhList,
          example: exampleContent,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        const itemId = res._id //插入知识点返回的id
        // 步骤3：创建关联记录
        return this.createRelationRecords(itemId, checkedLibraryIds)
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '提交成功', icon: 'success' })
        // 清空表单（包括选中状态）
        this.setData({
          enContent: '',
          posZhList: [{ pos: '', zh: '' }],
          exampleContent: '',
          checkedLibraryIds: [] // 清空选中值，复选框会自动取消选中
        })
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({ title: '提交失败', icon: 'none' })
        console.error('提交知识点失败：', err)
      })
  },


  // 创建关联记录（逻辑不变）
  createRelationRecords(itemId, libraryIds) {
    //核心逻辑："先构建一个 List，里面的内容虽然是向集合 item_set_relations 添加记录，但并没有执行，而是由 Promise.all() 调用 all 方法执行。"
    const promiseList = libraryIds.map(libraryId => {
      return db.collection('item_set_relations').add({
        data: {
          itemId: itemId,
          setId: libraryId,
          setType: 'library',
          reviewCount: 0,
          mastery: 0,
          lastReviewTime: null
        }
      })
    })
    return Promise.all(promiseList) //Promise是处理异步操作的核心对象
      .then(resList => {  //处理成功结果
        console.log('关联记录创建成功：', resList)
        return resList
      })
      .catch(err => {
        console.error('创建关联记录失败：', err)
        throw err
      })
      //all()是一个静态方法，用于并行处理多个 Promise
      /*
      db.collection('item_set_relations').add()  Promise 对象，并（通常）同时启动异步数据库插入操作。Promise.all() 的作用是并行等待这些已启动的操作全部完成，并统一处理结果或错误。
      */
  }
})