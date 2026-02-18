// pages/me/index.js
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    knowledgeCount: 0,
    todayReviewCount: 0,
    avgAccuracy: '0%'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getStudyStats()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getStudyStats()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getStudyStats(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 获取学习统计数据
   */
  getStudyStats(callback) {
    wx.showLoading({ title: '加载中...' })

    Promise.all([
      this.getKnowledgeCount(),
      this.getTodayReviewCount(),
      this.getAvgAccuracy()
    ]).then(([knowledgeCount, todayReviewCount, avgAccuracy]) => {
      this.setData({
        knowledgeCount,
        todayReviewCount,
        avgAccuracy: avgAccuracy + '%'
      })
      wx.hideLoading()
      callback && callback()
    }).catch(err => {
      console.error('获取学习统计失败：', err)
      wx.hideLoading()
      callback && callback()
    })
  },

  /**
   * 获取知识点总数
   */
  getKnowledgeCount() {
    return new Promise((resolve, reject) => {
      db.collection('knowledge_items')
        .count()
        .then(res => {
          resolve(res.total)
        })
        .catch(err => {
          console.error('获取知识点总数失败：', err)
          resolve(0)
        })
    })
  },

  /**
   * 获取今日复习数量
   */
  getTodayReviewCount() {
    return new Promise((resolve, reject) => {
      // 获取今日开始时间
      const today = new Date()
      today.setHours(0, 0, 0, 0)  //将时间调制0点
      const todayTime = today.getTime()

      db.collection('item_set_relations')
        .where({
          lastReviewTime: db.command.gt(todayTime)  //.gt()函数为大于todayTime时间
        })
        .count()
        .then(res => {
          resolve(res.total)
        })
        .catch(err => {
          console.error('获取今日复习数量失败：', err)
          resolve(0)
        })
    })
  },

  /**
   * 获取平均正确率
   */
  getAvgAccuracy() {
    return new Promise((resolve, reject) => {
      // 由于当前数据模型中没有存储正确率信息，暂时返回0
      // 后续可以在复习完成时记录正确率，然后在这里统计
      resolve(0)
    })
  },

  /**
   * 数据导出功能
   */
  exportData() {
    wx.showLoading({ title: '数据导出中...' })

    // 定义需要导出的数据表
    const collections = [
      'knowledge_items',
      'libraries',
      'item_set_relations',
      'groups',
      'essay_templates'
    ]

    // 导出所有数据表的数据
    const exportPromises = collections.map(collection => {
      return this.exportCollection(collection)
    })

    Promise.all(exportPromises)
      .then(results => {
        // 组装导出数据
        const exportData = {}
        collections.forEach((collection, index) => {
          exportData[collection] = results[index]
        })
        //上述代码，将results中的数据逐个存储在exportData集合中


        // 添加导出信息
        exportData.exportInfo = {
          exportTime: new Date().toISOString(),     //.toISOString() 将其转换为 UTC 时间的字符串
          version: '1.0.0',
          dataCount: collections.reduce((total, collection) => {    //.reduce函数意为对每个元素执行累加操作，最终返回一个总和
            return total + (exportData[collection]?.length || 0)
          }, 0)
          //dataCount为预导出的文件总数量
        }

        // 将数据转换为JSON字符串
        const jsonString = JSON.stringify(exportData, null, 2)
        //JSON.stringify为将 JavaScript 对象或值转换为 JSON 字符串
        //exportData为要转换的值，null不设置要求，2为指定缩进格式

        // 保存到本地文件
        const fileName = `my_english_bible_export_${Date.now()}.json`     //我的英语宝典+时间.json
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
        wx.getFileSystemManager().writeFile({           //将内容写入本地文件
          filePath: filePath,       //文件路径
          data: jsonString,                                       //写入内容
          encoding: 'utf8',                                       //编码格式
          success: () => {
            // 显示自动消失的消息提示框
            console.log("miniprogram\pages\me\index.js文件第205行输出：fileName " + fileName + " filePath " + filePath );
            wx.showToast({
              title: `数据已成功导出至: ${fileName}`,
              icon: 'success',
              duration: 1500
              // mask: false
            })
            
            // 延迟后询问是否打开文件，确保提示框有足够时间显示
            // setTimeout(() => {
            //   // 询问是否打开文件
            //   wx.showModal({
            //     title: '导出成功',
            //     content: '数据已成功导出，是否打开文件？',
            //     success: (res) => {
            //       if (res.confirm) {
            //         wx.openDocument({
            //           filePath: filePath,
            //           showMenu: true,         //显示菜单按钮
            //           success: () => {
            //             console.log('打开文档成功')
            //           },
            //           fail: (err) => {
            //             console.error('打开文档失败：', err)
            //             wx.showToast({ title: '打开文档失败', icon: 'none' })
            //           }
            //         })
            //       }
            //     }
            //   })
            // }, 1600) // 1.6秒后询问，确保提示框已消失
            
            wx.hideLoading()
          },
          fail: (err) => {
            console.error('保存文件失败：', err)
            wx.hideLoading()
            wx.showToast({ title: '导出失败', icon: 'none' })
          }
        })
      })
      .catch(err => {
        console.error('导出数据失败：', err)
        wx.hideLoading()
        wx.showToast({ title: '导出失败', icon: 'none' })
      })
  },

  /**
   * 导出单个集合的数据
   */
  exportCollection(collectionName) {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      const collection = db.collection(collectionName)

      // 分段获取数据
      const getData = (skip = 0, limit = 100, data = []) => {           
        //skip为当前已跳过的记录数，limit为每次查询的最大记录数，data为已获得的数据数组
        collection
          .skip(skip)     //跳过前skip条记录
          .limit(limit)   //限制每次查询返回limit条数据
          .get()
          .then(res => {
            const newData = data.concat(res.data)     //.concat意为将res的数据合并到data数据中
            if (res.data.length < limit) {            //说明数据库已无更多数据，递归结束
              // 数据获取完成
              resolve(newData)
            } else {
              // 继续获取下一批数据
              getData(skip + limit, limit, newData)
            }
          })
          .catch(err => {
            console.error(`获取${collectionName}数据失败：`, err)
            // 即使失败也返回已获取的数据，确保部分数据能够导出
            resolve(data)
          })
      }

      getData()
    })
  }
})