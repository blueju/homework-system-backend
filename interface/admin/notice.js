const fs = require('fs')
const path = require('path')

const Db = require('./../utils/db.js')
const Log = require('./../utils/log.js')
const CheckLogin = require('./../utils/checkLogin.js')

// 增加
module.exports.ADD_NOTICE = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
  }

  let content = ctx.request.body.content;
  let sql = 'INSERT INTO notice(content) values(?)'
  let data = [content]
  let result = await Db.add(sql, data)
  if (result.affectedRows === 1) {
    Log.add(ctx, `增加了一条通知`)
    return ctx.body = {
      success: true,
      message: '通知增加成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '通知增加失败'
    }
  }
}

// 删除
module.exports.DELETE_NOTICE = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
  }
  let _id = ctx.request.query._id;
  let sql = 'DELETE FROM notice WHERE `_id` = ?'
  let data = [_id]
  let result = await Db.del(sql, data)
  if (result.affectedRows === 1) {
    Log.add(ctx, `删除了一条通知`)
    return ctx.body = {
      success: true,
      message: '通知删除成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '通知删除失败'
    }
  }
}

//查询
module.exports.ALTER_NOTICE = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
  }

  let _id = ctx.request.body._id;
  let sql = 'DELETE FROM homework WHERE `_id` = ?'
  let data = [_id]
  let result = await Db.del(sql, data)
  if (result.affectedRows === 1) {
    Log.add(ctx, `删除了作业`)
    return ctx.body = {
      success: true,
      message: '作业删除成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '作业删除失败'
    }
  }
}