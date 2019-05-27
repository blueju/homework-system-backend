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

  /**
   * 0:正常普通的下载作业
   * 1:作业提交记录里的下载作业
   */
  let type = ctx.query.type;

  /**
   * 正常普通的下载作业
   */
  if (type === '0') {

    let subject = ctx.query.subject;
    let homework_name = ctx.query.name;
    let studentId = ctx.session.userId;
    let data = [studentId, subject, homework_name];
    let sql = "SELECT * FROM homework_files WHERE student_id =? AND `subject` =? AND homework_name =? ORDER BY upload_time  DESC LIMIT 0,1;"
    let result = await Db.find(sql, data)
    if (result.length === 0) {
      return ctx.body = {
        success: false,
        message: '你未提交过该作业'
      }
    }
    Log.add(ctx, `下载了作业：${subject}${homework_name}最新版本`)
    return ctx.body = {
      success: true,
      result
    }
  }

  /**
   * 作业提交记录里的下载作业
   */
  if (type === '1') {
    let version = ctx.query.version;
    let subject = ctx.query.subject;
    let homework_name = ctx.query.name;

    let studentId = ctx.session.userId;

    let data = [studentId, subject, homework_name];
    let sql = "SELECT new_file_name,version FROM homework_files WHERE student_id =? AND `subject` =? AND homework_name =? ORDER BY upload_time  DESC LIMIT 0,1;"
    let result = await Db.find(sql, data)
    if (result.length === 0) {
      console.log('点击作业提交记录里的下载按钮，但是后台查询却无该版本作业');
      Log.error('点击作业提交记录里的下载按钮，但是后台查询却无该版本作业');
      return ctx.body = {
        success: false,
        message: '获取作业失败，如重复出现该问题，管理员乱操作的锅，找他就对了'
      }
    }

    /**
     * 根据版本号，判断要下载的作业是？最新版：备份版
     * 如果从数据库查询到最新版本号===参数里的版本号，说明要下载最新版
     * 如果从数据库查询到最新版本号！=参数里的版本号，说明要下载备份版
     */
    if (result[0].version == version) {
      /**
       * 下载最新版作业
       */
      filePath = `${subject}/${homework_name}/word/${result[0].new_file_name}`
      Log.add(ctx, `下载了作业：${subject}${homework_name}版本号：${version}`)
      return ctx.body = {
        success: true,
        filePath
      }
    } else {
      /**
       * 下载备份版作业
       */
      data = [studentId, subject, homework_name, version];
      sql = "SELECT new_file_name,version FROM homework_files WHERE student_id =? AND `subject` =? AND homework_name =? AND version =? ORDER BY upload_time  DESC LIMIT 0,1;"
      result = await Db.find(sql, data);
      if (result.length === 0) {
        console.log('根据version，查询该版本作业备份版作业的名称，但是失败了');
        Log.error('根据version，查询该版本作业备份版作业的名称，但是失败了');
        return ctx.body = {
          success: false,
          message: '获取作业失败，如重复出现该问题，管理员乱操作的锅，找他就对了'
        }
      }
      filePath = `${subject}/${homework_name}/word_bak/${result[0].new_file_name}`
      Log.add(ctx, `下载了作业：${subject}${homework_name}版本号：${version}`)
      return ctx.body = {
        success: true,
        filePath
      }
    }
  }
}