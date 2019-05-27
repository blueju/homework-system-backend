const Redis = require('koa-redis')
const nodeMailer = require('nodemailer')
const cryptoJs = require('crypto-js')

const checkLogin = require('./../utils/checkLogin')
const CONFIG = require('./../../config')
const LOG = require('./../utils/log')
const DB = require('./../utils/db.js')

let Store = new Redis().client

// SMTP邮箱验证服务
module.exports.SEND_EMAIL_CODE = async function (ctx, next) {
  if (!checkLogin) {
    return ctx.body = {
      "success": true,
      "message": '未登录，请登录后再试'
    }
  }

  let {
    userId,
    userName,
    userClass,
    type,
    email
  } = ctx.session

  let lastSendEmailCodeTime = await Store.hmget(`emailCode:${userId}`, 'expire')
  if ((new Date().getTime() < lastSendEmailCodeTime)) {
    return ctx.body = {
      success: false,
      message: '邮箱验证码请求过于频繁'
    }
  }

  let transporter = nodeMailer.createTransport({
    service: 'qq',
    auth: {
      user: CONFIG.Email.user,
      pass: CONFIG.Email.pass
    }
  })

  let emailCode = CONFIG.Email.code()
  let expire = CONFIG.Email.expire()
  let options = {
    from: CONFIG.Email.user, //发件人
    to: email, //收件人
    subject: `${userClass} 学生作业管理系统 邮箱验证码`, //邮件主题
    html: `亲爱的${userName}同学:<br/>&emsp;&emsp;您好，您正在进行重置密码/修改绑定邮箱操作，如果非本人操作，请留意账号密码安全。<br/>&emsp;&emsp;本次邮箱验证码：${emailCode}，有效期为1分钟` //邮件内容
  }

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log('验证码邮件发送失败')
      LOG.add(ctx, '验证码邮件发送失败,具体错误信息：' + error)
    }
    console.log('验证码邮件发送成功')
    LOG.add(ctx, '验证码邮件发送成功')
    Store.hmset(`emailCode:${userId}`, 'email', email, 'emailCode', emailCode, 'expire', expire)
  })
  return ctx.body = {
    success: true
  }
}

module.exports.ALTER_PASSWORD = async function (ctx, next) {
  if (!checkLogin) {
    return ctx.body = {
      "success": true,
      "message": '未登录，请登录后再试'
    }
  }
  let {
    userId
  } = ctx.session
  let {
    code,
    password
  } = ctx.request.body
  password = cryptoJs.SHA1(password).toString();

  let redisEmailCode = (await Store.hmget(`emailCode:${userId}`, 'emailCode'))[0]
  console.log(code);
  console.log(redisEmailCode);
  if (code === redisEmailCode) {
    let sql = 'update student set `password` = ? where `id` = ?'
    let data = [password, userId];
    let result = await DB.update(sql, data);
    if (result.affectedRows === 1) {
      LOG.add(ctx, '密码修改成功')
      return ctx.body = {
        code: 1010,
        success: true,
        message: '密码修改成功'
      }
    } else {
      LOG.add(ctx, '密码修改失败')
      return ctx.body = {
        code: 1009,
        success: false,
        message: '密码修改失败'
      }
    }
  } else {
    LOG.add(ctx, '邮箱验证码错误')
    return ctx.body = {
      code: 1011,
      success: false,
      message: '邮箱验证码错误'
    }
  }
}