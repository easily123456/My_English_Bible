// pages/knowledge/create/index.js
// 1. 初始化云数据库（全局只需要初始化一次，若app.js已初始化，可省略这行）

// 2. 获取数据库引用
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   * 初始化与表单对应的所有变量
   */
  data: {
    // 动态释义列表：初始显示1行空对象（对应页面1行输入框）
    definitionsList: [{}],
    // 可选：若需要暂存表单数据，可在这里初始化，也可提交时直接从e.detail.value获取
    content: "",
    sentence: "",
    reviewType: "en_to_zh" // 默认复习类型：英->中
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时的初始化逻辑（暂无需要，可留空）
  },

  // 3. 动态添加释义行的函数（绑定到“+ 新增一行释义”按钮的bindtap）
  addDefinition() {
    try {
      const newDefinitionsList = [...this.data.definitionsList];
      //核心逻辑为根据原数组创建一个新数组
      // "... 是展开运算符（Spread Operator），它将 this.data.definitionsList 数组的元素展开，然后通过 [] 数组字面量语法将这些展开的元素重新组合成一个新数组，最后将新数组赋值给变量 newDefinitionsList。"
      //const newDefinitionsList = this.data.definitionsList; 这意为同一个数组的两个变量名
      //小程序通过 setData() 触发视图更新，而直接修改 this.data 或push() 可能无法被框架正确检测到变化

      // ② 新增一个空对象（代表新增一行输入框），为了触发页面渲染
      newDefinitionsList.push({});
      // ③ 更新data中的数组，页面会自动渲染新行
      this.setData({ //内置setData
        definitionsList: newDefinitionsList
      });
      // ④ 友好提示
      wx.showToast({
        title: '新增释义行成功',
        icon: 'success',//内置图标
        duration: 1000 //显示1秒
      });
    } catch (error) {
      // 异常处理：新增失败时提示
      wx.showToast({
        title: '新增失败，请重试',
        icon: 'none',
        duration: 1500
      });
      console.error('新增释义行失败：', error);
    }
  },

  // 4. 表单提交函数（绑定到<form>的bindsubmit）
  onSubmit(e) {//e是整个提交的事件对象
    try {
      const formData = e.detail.value;
      console.log('表单原始数据：', formData);
      /*
      表单绑定：<form bindsubmit="onSubmit"> 将表单的提交事件绑定到 onSubmit 函数。
      触发提交：当用户点击表单内 form-type="submit" 的按钮时，小程序会自动收集表单数据。
      数据打包：表单中所有 带 name 属性的输入控件（如 <input>、<picker> 等）的值会被自动组装成 {name1: value1, name2: value2} 的对象。
      数据获取：在 onSubmit(e) 中，通过 e.detail.value 提取用户输入的值。
      */
      //输出结果例如 { username: "Alice", password: "123456" }

      // ② 数据校验：核心字段不能为空
      if (!formData.content) {
        wx.showToast({
          title: '知识点内容不能为空',
          icon: 'none',
          duration: 1500
        });
        return; // 校验失败，终止提交
      }

      // ③ 组装definitions数组（把零散的partOfSpeech_0、meaning_0等拼成数据库需要的格式）
      const definitions = [];
      const listLength = this.data.definitionsList.length; // 获取当前释义行数量
      for (let i = 0; i < listLength; i++) {
        // 取第i行的词性和释义值
        const partOfSpeech = formData[`partOfSpeech_${i}`] || "";
        const meaning = formData[`meaning_${i}`] || "";
        // 占位符用 ${i} 表示，反引号 ` 包裹的内容会被解析为 可包含占位符的字符串，
        if (partOfSpeech && meaning) {
          definitions.push({
            partOfSpeech: partOfSpeech.trim(), // 去除前后空格
            meaning: meaning.trim()
          });
        }
      }
      // 校验释义数组：至少有一行有效数据
      if (definitions.length === 0) {
        wx.showToast({
          title: '至少填写一行释义与词性',
          icon: 'none',
          duration: 1500
        });
        return;
      }

      // ④ 组装最终要存入数据库的数据
      const knowledgeData = {
        content: formData.content.trim(), // 知识点内容（去空格）
        definitions: definitions, // 释义数组
        sentence: formData.sentence ? formData.sentence.trim() : "", // 例句（可选）
        reviewType: formData.reviewType || "en_to_zh", // 复习类型（默认英->中）
        createTime: db.serverDate() // 服务器时间（避免本地时间错乱）
      };
      console.log('要存入数据库的数据：', knowledgeData);

      // ⑤ 调用云数据库add方法，插入数据
      db.collection('knowledge_items').add({//数据库向集合knowledge_items添加值
      //核心逻辑向数据库的 knowledge_items 集合提交数据（knowledgeData），并根据提交结果（成功/失败）执行不同的回调逻辑（显示提示并跳转或报错）
        data: knowledgeData,
        success: (res) => {
          // 提交成功：提示+返回上一页
          wx.showToast({
            title: '知识点创建成功',
            icon: 'success',
            duration: 1500
          });
          // 1.5秒后返回上一页（让用户看到提示）
          setTimeout(() => {
            wx.navigateBack({
              delta: 1 // 返回上一级页面
            });
          }, 1500);
        },
        fail: (err) => {
          // 提交失败：提示错误
          wx.showToast({
            title: '创建失败，请重试',
            icon: 'none',
            duration: 2000
          });
          console.error('数据库插入失败：', err);
        }
      });

    } catch (error) {
      // 全局异常捕获
      wx.showToast({
        title: '提交异常，请重试',
        icon: 'none',
        duration: 2000
      });
      console.error('表单提交异常：', error);
    }
  },

  /**
   * 可选：表单重置函数（若需要“清空表单”按钮，可绑定bindreset="onReset"）
   */
  onReset() {
    this.setData({
      definitionsList: [{}], // 重置为1行释义
      content: "",
      sentence: "",
      reviewType: "en_to_zh"
    });
    wx.showToast({
      title: '表单已清空',
      icon: 'none',
      duration: 1000
    });
  }
});