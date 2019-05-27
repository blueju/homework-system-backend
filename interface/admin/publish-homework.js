const fs = require('fs')
const path = require('path')

const Db = require('./../utils/db.js')
const Log = require('./../utils/log.js')
const CheckLogin = require('./../utils/checkLogin.js')

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
    subject,
    homeworkName,
    deadline,
    remark,
    teacher,
    templatePath,
    suffix,
  } = ctx.request.body;

  /** 创建目录 */
  let target_path = path.join(process.cwd(), 'static', 'homework', subject, homeworkName)
  fs.mkdir(target_path, {
    recursive: true
  }, (err) => {
    if (err) {
      console.log(err);
      console.log('创建作业文件夹的过程中，出现错误');
      return ctx.body = {
        success: false,
        message: '创建作业文件夹的过程中，出现错误'
      }
    } else {
      try {
        fs.mkdirSync(path.join(target_path, 'word'))
        fs.mkdirSync(path.join(target_path, 'word_bak'))
        console.log('文件夹创建完毕，无错误，可正常上传作业');
      } catch (error) {
        console.log('创建word文件夹和word_bak文件夹的过程中，出现错误');
        return ctx.body = {
          success: false,
          message: '创建word文件夹和word_bak文件夹的过程中，出现错误'
        }
      }
    }
  });

  /** 操作数据库 */
  let sql = 'insert into homework(`subject`,`homework_name`,`deadline`,`remark`,`teacher`,`template_path`,`suffix`) value(?,?,?,?,?,?,?)'
  let data = [subject, homeworkName, deadline, remark, teacher, templatePath, suffix]



  let result = await Db.add(sql, data)
  if (result.affectedRows === 1) {
    Log.add(ctx, `发布了新作业`)
    return ctx.body = {
      success: true,
      message: '作业发布成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '作业发布失败'
    }
  }
}