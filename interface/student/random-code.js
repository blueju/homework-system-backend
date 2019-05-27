const Redis = require('koa-redis')
const nodeMailer = require('nodemailer')
const Email = require('./../../config.js')

let Store = new Redis().client

module.exports = async function (ctx) {
  //获取邮箱地址
  let email = ctx.request.body.email;
  //从session获取用户名
  let userName = ctx.session.userName;
  //获取过期时间
  const saveExpire = await Store.hget(`nodemail:${userName}`, 'expire')
  // 根据过期时间，判断是否验证码过期
  // if (saveExpire && new Date().getTime() - saveExpire < 0) {
  //   ctx.body = {
  //     success: 'false',
  //     message: '验证码请求过于频繁'
  //   }
  //   return false
  // }
  // 
  let transporter = nodeMailer.createTransport({
    service: 'qq',
    auth: {
      user: Email.smtp.user,
      pass: Email.smtp.pass
    }
  })
  /**
   * 
   */
  let ko = {
    code: Email.smtp.code(),
    expire: Email.smtp.expire(),
    email: ctx.request.body.email,
    user: ctx.session.userName
  }
  let mailOptions = {
    from: `${Email.smtp.user}`,
    to: ko.email,
    subject: '【作业系统】验证码',
    html: `Hi，${ko.user}<br/>我们收到了你重置邮箱的申请邀请码是${ko.code}`
  }
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error)
    } else {
      Store.hmset(
        `nodemail:${ko.user}`,
        'code',
        ko.code,
        'expire',
        ko.expire,
        'email',
        ko.email
      )
    }
  })
  ctx.body = {
    success: true
  }
}