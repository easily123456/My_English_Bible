// 云函数入口文件：初始化7个知识库数据
const cloud = require('wx-server-sdk')
//require('wx-server-sdk')加载微信云开发的官方 SDK，其提供了操作云资源的JavaScript API

cloud.init({
  env: 'cloud1-8gt5l7qj836a4102' 
})

// 获取数据库实例
const db = cloud.database()

// 云函数入口函数（被调用时执行）
exports.main = async (event, context) => {
  //exports.main为模块导出语法，将 main 函数暴露给外部（即微信云开发平台），云平台会调用main来执行逻辑
  //async是个异步函数，event是触发云函数时传入的数据，context是云函数的运行时信息
  try {
    // 步骤1：定义7个预设的知识库数据（严格匹配任务0的字段规则）
    const libraryList = [
      {
        name: "单词集合（英译中）",
        libraryType: "single", // 单点复习类型
        reviewType: "en_to_zh", // 英→中复习方向
        description: "核心阅读高频英语词汇，采用英→中单点复习模式"
      },
      {
        name: "单词集合（中译英）",
        libraryType: "single", // 单点复习类型
        reviewType: "zh_to_en", // 英→中复习方向
        description: "核心作文高频英语词汇，采用中→英单点复习模式"
      },
      {
        name: "词组大全",
        libraryType: "single", // 单点复习类型
        reviewType: "en_to_zh", // 英→中复习方向
        description: "核心阅读高频英语词汇，采用英→中单点复习模式"
      },
      {
        name: "功能句型",
        libraryType: "collection", 
        description: "作文常用短句"
      },
      {
        name: "作文高级词汇",
        libraryType: "collection", 
        description: "作文常用升级词汇"
      },
      {
        name: "易混淆词汇",
        libraryType: "confusion", // 混淆自测类型（无reviewType）
        description: "易混淆英语词组，采用混淆自测模式"
      },
      {
        name: "作文模板",
        libraryType: "display",
        description: "常用作文模板"
      },
    ]

    // 步骤2：批量插入数据到libraries集合
    // add方法支持传入数组，实现批量插入
    const addResult = await db.collection('libraries').add({
      data: libraryList
    })
    //addResult：存储插入操作的结果（如生成的记录 ID）

    // 步骤3：返回成功结果
    return {
      success: true,
      code: 200,
      data: addResult, // 包含插入的记录ID等信息
      msg: "7个知识库数据初始化成功！"
    }

  } catch (error) {
    // 捕获错误并返回（方便排查问题）
    return {
      success: false,
      code: 500,
      error: error.message, // 错误详情
      msg: "初始化失败，请检查云函数权限或集合是否存在"
    }
  }
}