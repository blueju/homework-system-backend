const fs = require('fs')
const path = require('path')

const router = require('koa-router')()
const cryptoJs = require('crypto-js')
const Redis = require('koa-redis')
const svgCaptcha = require('svg-captcha');

const Db = require('../utils/db.js')
const Log = require('../utils/log.js')
const checkLogin = require('./../utils/checkLogin.js')

let Store = new Redis().client

// 获取验证码
function getCaptcha(ctx) {
  let req = ctx.request
  let res = ctx.response
  var captcha = svgCaptcha.create({
    // 翻转颜色 
    inverse: false,
    // 字体大小 
    fontSize: 36,
    // 噪声线条数 
    noise: 2,
    // 宽度 
    width: 80,
    // 高度 
    height: 30,
  });
  // 保存到session,忽略大小写 
  req.session = captcha.text.toLowerCase();
  console.log(req.session); //0xtg 生成的验证码
  //保存到cookie 方便前端调用验证
  ctx.cookies.set('captcha', req.session, {
    domain: 'localhost', // 写cookie所在的域名
    path: '/register', // 写cookie所在的路径
    maxAge: 1000 * 60, // cookie有效时长
    // expires: new Date('2018-02-08'), // cookie失效时间
    httpOnly: false, // 是否只用于http请求中获取
    overwrite: false // 是否允许重写
  });
  // ctx.headerSent('Content-Type', 'image/svg+xml');
  ctx.response.set('Content-Type', 'image/svg+xml');
  // res.setHeader('Content-Type', 'image/svg+xml');
  // res.write(String(captcha.data));
  return ctx.body = String(captcha.data)
  // res.end();
}

// 获取验证码
router.get('/get-captcha', async (ctx, next) => {
  debugger
  console.log('xxx');
  return getCaptcha(ctx);
})



/** 登录 */
router.post('/login', async (ctx, next) => {
  if (checkLogin(ctx)) {
    return ctx.body = {
      code: 1003,
      success: false,
      message: '您已登录'
    }
  }
  let studentId = ctx.request.body.StudentId
  let password = ctx.request.body.Password
  let twicePassword = cryptoJs.SHA1(password).toString()
  let sql, result;
  // 管理员检测
  sql = `select * from admin where id = '${studentId}'`
  result = await Db.find(sql)
  if (result.length === 1) {
    if (twicePassword === result[0].password) {
      // 管理员-密码对的上-登录成功
      ctx.session.userId = studentId
      ctx.session.userName = result[0].name
      ctx.session.type = 'admin'
      ctx.session.userClass = result[0].class
      ctx.session.email = result[0].email
      ctx.session.phone = result[0].phone
      Log.add(ctx, '管理员登录成功')
      return ctx.body = {
        success: true,
        message: '管理员登录成功',
        data: ctx.session
      }
    } else {
      // 管理员-密码对不上-登录失败
      Log.add(ctx, '管理员登录失败')
      return ctx.body = {
        success: false,
        message: '登录失败，账号或密码错误',
        data: ctx.session
      }
    }
  } else {
    // 普通学生用户
    sql = `select * from student where id = ${studentId}`
    result = await Db.find(sql)
    if (result.length === 1) {
      if (twicePassword === result[0].password) {
        // 学生用户-密码对的上
        ctx.session.userId = studentId
        ctx.session.userName = result[0].name
        ctx.session.type = 'student'
        ctx.session.userClass = result[0].class
        ctx.session.email = result[0].email
        ctx.session.phone = result[0].phone
        Log.add(ctx, '登录成功')
        ctx.body = {
          code: 1005,
          success: true,
          message: '登录成功',
          data: ctx.session
        }
        return
      } else {
        // 学生用户-密码对不上
        Log.add(ctx, '登录失败，账号或密码错误')
        return ctx.body = {
          success: false,
          message: '账号或密码错误'
        }
      }
    }
  }
})

/** 注册 */
router.post('/register', async (ctx, next) => {
  let studentId = ctx.request.body.StudentId
  let studentName = ctx.request.body.StudentName
  let email = ctx.request.body.Email
  let phone = ctx.request.body.Phone
  let password = ctx.request.body.Password
  let twicePassword = cryptoJs.SHA1(password).toString()

  let sql = `select * from student where id = ${studentId}`
  let result = await Db.find(sql)
  /** 判断用户是否存在 */
  if (result.length > 0) {
    ctx.body = {
      code: 1000,
      success: false,
      message: '该学号已被注册，如非本人注册，请向管理员反馈'
    }
    return
  }

  sql = null
  result = null
  sql = `insert into student(id,name,email,password,phone) values(?,?,?,?,?)`
  let data = [studentId, studentName, email, twicePassword, phone]
  result = await Db.add(sql, data) //得到数据库返回的结果
  if (result.affectedRows === 0) {
    ctx.body = {
      code: 1001,
      success: false,
      message: '注册失败'
    }
  } else {
    ctx.body = {
      code: 1002,
      success: true,
      message: '注册成功'
    }
  }
})

/** 退出 */
router.get('/exit', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      message: '未登录，无需退出，已记录访问IP，请勿恶意调用此接口'
    }
    return
  }
  ctx.session.userId = null
  ctx.session.userName = null
  ctx.session.type = null
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: true,
      message: '退出成功'
    }
  }
})

/** 检查登录 */
router.get('/checkLogin', async (ctx, next) => {
  if (checkLogin(ctx)) {
    console.log(`${ctx.session.userId}${ctx.session.userName}仍在线`)
    ctx.body = {
      code: 1003,
      success: true,
      message: '已登录',
      data: ctx.session
    }
    return
  } else {
    ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
    return
  }
})

/** 查看更新日志 */
router.get('/updateLog', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let sql = 'select * from log'
  let result = await Db.find(sql)
  if (result.length > 0) {
    ctx.body = {
      success: true,
      result
    }
  } else {
    ctx.body = {
      success: false,
      message: '未查询到更新日志'
    }
  }
})


/** 获取系统介绍信息 */
router.get('/about', async (ctx, next) => {
  if (!checkLogin) {
    return ctx.body = {
      success: false,
      message: '未登录'
    }
  }

  let fileData = await fs.readFileSync(path.join(__dirname, 'about.md'), 'utf8');
  if (fileData === null || fileData === undefined) {
    Log.add(ctx, '读取Markdown文件发生错误：' + err)
    return ctx.body = {
      success: false,
      message: '获取系统使用教程失败'
    }
  }
  // console.log(fileData);
  return ctx.body = {
    success: true,
    message: fileData
  }
})

// 找回密码时验证手机号码是否存在
router.get('/validate-phone-number', async (ctx, next) => {
  if (!checkLogin) {
    return ctx.body = {
      success: false,
      message: '未登录，无需退出，已记录访问IP，请勿恶意调用此接口'
    }
  }
  let {
    studentId,
    phoneNumber
  } = ctx.request.query
  let sql = 'select phone from student where id = ?'
  let data = [studentId]
  let SQL_RESULT = await Db.find(sql, data)
  console.log(SQL_RESULT);
  if (SQL_RESULT.length === 1) {
    if (SQL_RESULT[0].phone === phoneNumber) {
      return ctx.body = {
        success: true,
        message: "学号与手机号码匹配"
      }
    } else {
      return ctx.body = {
        success: false,
        message: "学号与手机号码不匹配"
      }
    }
  } else {
    return ctx.body = {
      success: false,
      message: "学号与手机号码不匹配"
    }
  }
})


// 找回密码时，发送短信验证码
router.post('/send-message-code', async (ctx, next) => {
  if (!checkLogin) {
    return ctx.body = {
      success: false,
      message: '未登录，无需退出，已记录访问IP，请勿恶意调用此接口'
    }
  }

  let {
    studentId,
    phoneNumber
  } = ctx.request.body

  let lastSendMessageCodeTime = await Store.hmget(`messageCode:${studentId}`, 'expire')
  if ((new Date().getTime() < lastSendMessageCodeTime)) {
    return ctx.body = {
      success: false,
      message: `短信验证码请求过于频繁`
    }
  }

  let messageCode = Math.random().toString(16).slice(2, 7).toUpperCase()
  let messageCode_to_password = cryptoJs.SHA1(cryptoJs.SHA1(messageCode).toString()).toString()
  console.log(messageCode);

  let now = new Date().getTime()
  // let expire = now + 1000
  let expire = now + 1000 * 60 * 15

  try {
    Store.hmset(`messageCode:${studentId}`, 'expire', expire, 'phoneNumber', phoneNumber)
  } catch (error) {
    Log.add(ctx, 'redis插入数据失败' + error)
    return ctx.body = {
      success: false,
      message: '发生错误，请告知管理员'
    }
  }


  /**
   * 短信验证码
   */
  const Core = require('@alicloud/pop-core');
  var client = new Core({
    accessKeyId: 'LTAIn1wxdHtUISKv',
    accessKeySecret: 'qsLxfS4zqDFliOMn0etn4ANkcLIUFP',
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
  });
  var params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phoneNumber,
    "SignName": "学生作业管理系统",
    "TemplateCode": "SMS_163432860",
    "TemplateParam": `{'code':'${messageCode}'}`
  }
  var requestOption = {
    method: 'POST'
  };

  client.request('SendSms', params, requestOption).then(async (result) => {
    // let result = {
    //   Message: 'OK1446',
    //   RequestId: '455736A3-4024-4FBB-BD66-17C8ADFD3E37',
    //   BizId: '783318055251833490^0',
    //   Code: 'OK154'
    // }
    console.log(result);
    if (result.Code === 'OK') {
      console.log('此处应该收到短信');
      let sql = 'update student set `password` = ? where `id` = ?'
      let data = [messageCode_to_password, studentId]
      let SQL_RESULT = await Db.update(sql, data)
      if (SQL_RESULT.affectedRows === 1) {
        Log.add(ctx, '短信验证码已发送，并且修改数据库密码时没有错误')
        return ctx.body = {
          success: true,
          message: '短信验证码已发送，请注意查收'
        }
      } else {
        console.log('短信验证码已发送，但修改数据库密码时发生错误');
        Log.add(ctx, '短信验证码已发送，但修改数据库密码时发生错误')
        return ctx.body = {
          success: false,
          message: '发生未知错误，请告知管理员'
        }
      }
    } else {
      Log.add(ctx, '短信验证码发送失败' + result.Message)
      return ctx.body = {
        success: false,
        message: '短信验证码发送失败'
      }
    }
  }, (error) => {
    console.log(error);
    Log.add(ctx, '短信验证码发送失败' + error)
    return ctx.body = {
      success: false,
      message: '短信验证码发送失败'
    }
  })
})

module.exports = router