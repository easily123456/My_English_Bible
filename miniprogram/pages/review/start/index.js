// pages/review/start/index.js
Page({
  data: {
    libraryId: '',
    libraryType: '',
    libraryName: ''
  },

  onLoad(options) {
    const { libraryId, libraryType, libraryName } = options;

    if (!libraryId || !libraryType) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({
      libraryId,
      libraryType,
      libraryName
    })

    // 延迟 800ms 再跳转，体验更流畅
    setTimeout(() => {
      this.routeToReviewPage()
    }, 800)
  },

  // 核心：复习路由
  routeToReviewPage() {
    const { libraryId, libraryType, libraryName } = this.data
    let url = ''

    switch (libraryType) {
      case 'single':
        url = `/pages/review/single/index?libraryId=${libraryId}&libraryName=${libraryName}`
        break
      case 'collection':
        url = `/pages/review/collection/index?libraryId=${libraryId}&libraryName=${libraryName}`
        break
      case 'confusion':
        url = `/pages/review/confusion/index?libraryId=${libraryId}&libraryName=${libraryName}`
        break
      default:
        wx.showToast({ title: '不支持的复习类型', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
    }

    wx.redirectTo({
      url,
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  }
})