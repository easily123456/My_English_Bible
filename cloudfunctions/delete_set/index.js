const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 1. 替换为你的集合名称
    const collectionName = 'item_set_relations';

    // 2. 检查集合是否存在（可选）
    // 微信云开发暂时不支持直接检查集合是否存在，所以跳过此步骤

    // 3. 查询所有记录的 _id
    const res = await db.collection(collectionName).get();
    const ids = res.data.map(item => item._id);

    console.log(`共查询到 ${ids.length} 条记录，准备删除...`);

    // 4. 分批删除记录（每次删除最多 100 条）
    if (ids.length > 0) {
      for (let i = 0; i < ids.length; i += 100) {
        const batchIds = ids.slice(i, i + 100);
        await db.collection(collectionName).where({
          _id: db.command.in(batchIds)
        }).remove();
        console.log(`已删除第 ${i + 1} ~ ${Math.min(i + 100, ids.length)} 条记录`);
      }
    }

    return {
      success: true,
      message: `集合 ${collectionName} 已清空，共删除 ${ids.length} 条记录`
    };
  } catch (err) {
    console.error('删除失败:', err); // 打印详细错误信息到日志
    return {
      success: false,
      error: err // 返回错误对象，方便调试
    };
  }
};
