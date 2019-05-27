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
   * 科目
   * 老师
   * 后缀
   * 作业名称
   */
  let {
    subject,
    teacher
  } = ctx.request.query;
  let suffix = ctx.request.query.suffix === 'undefined' ? '' : ctx.request.query.suffix;
  let homeworkName = ctx.request.query.name;
  let version = null;

  /**
   * 学号
   * 姓名
   */
  let studentId = ctx.session.userId;
  let studentName = ctx.session.userName;

  /**
   * 查询数据库，获取作业版本
   */
  let data = [studentId, subject, homeworkName];
  let sql = "SELECT version FROM homework_files WHERE student_id =? AND `subject` =? AND homework_name =? ORDER BY upload_time  DESC LIMIT 0,1;"
  let result = await Db.find(sql, data)
  if (result.length === 0) {
    version = 0
  } else {
    version = result[0].version
  }
  data = null;
  sql = null;
  result = null;

  /**
   * 1、获取上传的作业，其中homeworkFile是不定的，要与前端上传的文件的key值匹配对应
   */
  let homeworkFile = ctx.request.files.file;

  /**
   * 判断文件是否存在
   */
  let checkPath = path.join(process.cwd(), 'static', 'homework', subject, homeworkName, 'word', `${studentId}${studentName}${suffix}.docx`);
  try {
    fs.accessSync(checkPath);
    let oldPath = checkPath;
    let newPath = path.join(process.cwd(), 'static', 'homework', subject, homeworkName, 'word_bak', `${studentId}${studentName}${suffix}_版本号：${Number(version)}.docx`);
    try {
      /** 移动文件 */
      fs.renameSync(oldPath, newPath);
      /**
       * 移动文件成功后，修改数据库该作业版本的文件名
       * 15251101249蓝钜 → 15251101249蓝钜_版本号：1
       */
      sql = 'update homework_files SET `new_file_name` = ? WHERE `student_id` = ? AND `subject` = ? AND `homework_name` = ? AND version = ?';
      data = [`${studentId}${studentName}${suffix}_版本号：${Number(version)}.docx`, studentId, subject, homeworkName,Number(version)]
      result = await Db.update(sql, data);
      if (result.affectedRows != 1) {
        console.log('成功移动文件后，对该版本作业的数据库修改名称操作出错');
        return ctx.body = {
          code: 1008,
          success: false,
          message: '发生错误，如重复出现，请联系管理员处理'
        }
      }
    } catch (error) {
      console.log('文件移动失败，应该立即停止，继续操作会将同学原来的作业覆盖掉');
      return ctx.body = {
        code: 1007,
        success: false,
        message: '发生错误，如重复出现，请联系管理员处理'
      }
    }
  } catch (error) {
    /**
     * 错误不一定就是坏的，此处报错说明：该同学尚未上传过该项作业，不影响无需担心可继续运行
     */
  }
  /**
   * 1、获取后缀名（因为我们只上传docx，因此只考虑截取后四位）
   * 2、拼接目标存储路径（项目目录/static/homework/科目名称/作业名称/word/学号姓名后缀.docx）
   */
  let wordName = homeworkFile.name;
  let targetPath = path.join(process.cwd(), 'static', 'homework', subject, homeworkName, 'word', `${studentId}${studentName}${suffix}.docx`);
  let newName = `${studentId}${studentName}${suffix}.docx`;

  /**
   * 术语：创建可读流
   * 大白话：其实插件koa-body已经帮我们把文件存在一个临时目录了，我们现在创建一个流，为的是将临时目录下的文件送出去，因此叫可读流
   */
  const reader = fs.createReadStream(homeworkFile.path);

  /**
   * 术语：创建可写流
   * 大白话：其实插件koa-body已经帮我们把文件存在一个临时目录了，我们现在创建一个流，为的是在接收别处传过来的文件，因此叫可写流
   */
  const writer = fs.createWriteStream(targetPath);

  /**
   * 执行最终读写操作，将文件从临时目录→目标目录
   */
  try {
    reader.pipe(writer);
  } catch (error) {
    return ctx.body = {
      success: false,
      message: '作业上传失败，请重新尝试'
    }
  }

  /**
   * 执行记录操作
   */
  sql = `insert into homework_files(student_id,student_name,subject,homework_name,teacher_name,old_file_name,new_file_name,version) value(?,?,?,?,?,?,?,?)`;
  data = [studentId, studentName, subject, homeworkName, teacher, wordName, newName, Number(version) + 1];
  result = await Db.update(sql, data);
  if (result.affectedRows === 0) {
    console.log('上传作业记录插入数据库失败');
    return;
  }
  Log.add(ctx, `上传了作业,作业名是：${studentId}${studentName}${suffix}.docx`)
  ctx.body = {
    success: true,
    message: '作业上传成功'
  };
}