const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 1. 定义需要清空的集合名称数组
    const collectionNames = ['knowledge_items', 'libraries', 'groups']; // 替换为你需要清空的集合名称
    
    // 2. 存储每个集合的删除结果
    const results = [];
    
    // 3. 循环处理每个集合
    for (const collectionName of collectionNames) {
      try {
        // 查询所有记录的 _id
        const res = await db.collection(collectionName).get();
        const ids = res.data.map(item => item._id);

        console.log(`集合 ${collectionName}：共查询到 ${ids.length} 条记录，准备删除...`);

        // 分批删除记录（每次删除最多 100 条）
        if (ids.length > 0) {
          for (let i = 0; i < ids.length; i += 100) {
            const batchIds = ids.slice(i, i + 100);
            await db.collection(collectionName).where({
              _id: db.command.in(batchIds)
            }).remove();
            console.log(`集合 ${collectionName}：已删除第 ${i + 1} ~ ${Math.min(i + 100, ids.length)} 条记录`);
          }
        }

        results.push({
          collection: collectionName,
          success: true,
          count: ids.length,
          message: `集合 ${collectionName} 已清空，共删除 ${ids.length} 条记录`
        });
      } catch (collectionError) {
        console.error(`删除集合 ${collectionName} 时出错:`, collectionError);
        results.push({
          collection: collectionName,
          success: false,
          error: collectionError
        });
      }
    }

    return {
      success: true,
      message: '多集合删除操作完成',
      results: results
    };
  } catch (err) {
    console.error('删除过程中发生错误:', err);
    return {
      success: false,
      error: err
    };
  }
};
