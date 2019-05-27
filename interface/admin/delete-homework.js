const fs = require('fs')
const path = require('path')

const Db = require('./../utils/db.js')
const Log = require('./../utils/log.js')
const CheckLogin = require('./../utils/checkLogin.js')

// 获取作业收集详情
module.exports = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
  }

  let {
    _id
  } = ctx.request.body;
  let sql = null;
  let data = null;
  let SQL_RESULT = null;

  sql = "delete from `homework` where _id = ?;"
  data = [_id]
  SQL_RESULT = await Db.del(sql, data)
  console.log('SQL_RESULT', SQL_RESULT);
  if (SQL_RESULT.affectedRows === 1) {
    return ctx.body = {
      success: true,
      message: '删除成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '删除失败'
    }
  }
}