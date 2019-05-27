const path = require('path')
const fs = require('fs')
const router = require('koa-router')();

const Db = require('../utils/db.js');
const Log = require('../utils/log.js');
const checkLogin = require('./../utils/checkLogin.js')

/**
 * 查看最近作业/历史作业
 */
router.get('/recently-homework', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let sql = null;
  /**
   * 0：最近作业
   * 1：历史作业
   */
  if (ctx.query.type == 0) {
    sql = 'select * from homework where `show` = "true"';
  } else {
    sql = 'select * from homework where `show` = "false"';
  }
  let result = await Db.find(sql);
  if (result.length > 0) {
    ctx.body = {
      success: true,
      result
    }
  } else {
    ctx.body = {
      success: false,
      message: '未查询到相关内容'
    }
  }
})

/**
 * 查看通知
 */
router.get('/notice', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let sql = 'select * from notice';
  let result = await Db.find(sql);
  if (result.length > 0) {
    ctx.body = {
      success: true,
      result
    }
  } else {
    ctx.body = {
      success: false,
      message: '未查询到相关内容'
    }
  }
})

/**
 * 查看通知
 */
router.get('/my-log', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let sql = 'select * from log ORDER BY `insert_time` DESC LIMIT 0, 20';
  let result = await Db.find(sql);
  if (result.length > 0) {
    ctx.body = {
      success: true,
      result
    }
  } else {
    ctx.body = {
      success: false,
      message: '未查询到相关内容'
    }
  }
})

/**
 * 上传作业
 */
const UploadHomework = require('./upload-homework.js')
router.post('/upload-homework', UploadHomework)

/**
 * 下载作业
 */
const DownloadHomework = require('./download-homework.js')
router.get('/download-homework', DownloadHomework)

/**
 * 删除作业
 */
const DeleteoadHomework = require('./delete-homework.js')
router.get('/delete-homework-file', DeleteoadHomework)

/**
 * 发送验证码
 */
const RandomCode = require('./random-code.js')
router.post('/random-code', RandomCode)

/**
 * 作业提交记录
 */
const HomeworkUploadHistory = require('./homework-upload-history.js')
router.get('/homework-upload-history', HomeworkUploadHistory)

/**
 * 系统设置
 * ——发送邮箱验证码
 * ——修改密码
 */
const SETTING = require('./../setting/index')
router.post('/send-email-code', SETTING.SEND_EMAIL_CODE)
router.post('/alter-password', SETTING.ALTER_PASSWORD)




module.exports = router;