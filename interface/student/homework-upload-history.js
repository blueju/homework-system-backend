const path = require('path')
const fs = require('fs')

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

  let studentId = ctx.session.userId;
  let subject = ctx.query.subject;
  let homeworkName = ctx.query.homework_name;

  let sql = "SELECT * FROM homework_files WHERE `student_id` = ? AND `subject` = ? AND `homework_name` = ? ORDER BY `upload_time` DESC";
  let data = [studentId, subject, homeworkName];
  let result = await Db.find(sql, data)
  if (result.length === 0) {
    return ctx.body = {
      success: false,
      message: '你未提交过该作业'
    }
  }
  return ctx.body = {
    success: true,
    result
  }

}