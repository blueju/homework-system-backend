const fs = require('fs')
const path = require('path')

const Db = require('./../utils/db.js')
const Log = require('./../utils/log.js')
const CheckLogin = require('./../utils/checkLogin.js')

module.exports = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return ctx.body = {
      success: false,
      message: '未登录'
    }
  }

  return ctx.body = {
    success: true,
    message: '为保障作业安全，防止同学们的误操作导致作业误删除，暂不提供线上作业删除服务'
  }
}