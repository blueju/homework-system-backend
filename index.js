const path = require('path')

const Koa = require('koa')
const static = require('koa-static')
const session = require("koa-session");
const koaBody = require('koa-body');

const {
  port
} = require('./config.js')
const public = require('./interface/public/index.js')
const student = require('./interface/student/index.js')
const admin = require('./interface/admin/index.js')


const app = new Koa()
app.use(static(path.join(process.cwd(), 'static'))) //作业文件
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 20 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
  }
}));

/**
 * koa-session配置
 */
app.keys = ['homework']; //cookie签名
const CONFIG = {
  key: 'koa:sess',
  maxAge: 15 * 60 * 1000, //cookie过期时间，单位为毫秒
  httpOnly: true,
  renew: true, //session有效期内用户有操作，当session快过期时会重新设置session
};

app.use(session(CONFIG, app));

// 公共接口
app.use(public.routes()).use(public.allowedMethods())

// 学生用户
app.use(student.routes()).use(student.allowedMethods());

// 管理员
app.use(admin.routes()).use(admin.allowedMethods());

// 服务端口
app.listen(port, () => {
  console.log(`运行在http://127.0.0.1:${port}`);
});