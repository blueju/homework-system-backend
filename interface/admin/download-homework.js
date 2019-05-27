const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const ZIP_LOCAL = require('zip-local')

const {
  port
} = require('./../../config.js')
const Db = require('./../utils/db.js')
const Log = require('./../utils/log.js')
const CheckLogin = require('./../utils/checkLogin.js')

// 获取作业收集详情
module.exports.GET = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return (ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    })
  }

  let {
    subject,
    homeworkName
  } = ctx.request.query
  let sql = null
  let data = null
  let SQL_RESULT = null

  let submitedNumber = null
  let noSubmitedNumber = null
  let totalNumber = null
  let submitedList = null

  sql = 'SELECT id,name FROM `student`;'
  SQL_RESULT = await Db.find(sql)
  totalNumber = SQL_RESULT.length //班级总人数
  totalList = SQL_RESULT //班级名单

  sql =
    'SELECT * FROM homework_files WHERE homework_files.`subject` = ? AND homework_files.homework_name = ? GROUP BY student_name'
  data = [subject, homeworkName]
  SQL_RESULT = await Db.find(sql, data)

  submitedNumber = SQL_RESULT.length //已提交人数
  noSubmitedNumber = totalNumber - submitedNumber //未提交人数

  submitedList = SQL_RESULT //已提交人员名单

  return (ctx.body = {
    success: true,
    result: {
      submitedNumber,
      noSubmitedNumber,
      totalNumber,
      submitedList,
      totalList
    }
  })
}

// 下载打包文件
module.exports.ZIP = async function (ctx) {
  /** 判断是否登录 */
  if (!CheckLogin(ctx)) {
    return (ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    })
  }

  if (
    ctx.request.body.toString().includes('{}') ||
    !ctx.request.body.subject ||
    !ctx.request.body.homeworkName
  ) {
    return (ctx.body = {
      success: false,
      message: '参数错误'
    })
  }

  let {
    subject,
    homeworkName
  } = ctx.request.body

  // 设置要压缩的目录/文件夹
  let needCompressFolderPath = path.join(
    process.cwd(),
    'static',
    'homework',
    subject,
    homeworkName,
    'word'
  )
  // 压缩时间戳
  let compressTime = new Date().getTime()
  // 压缩包输出路径
  let outputPath = path.join(
    process.cwd(),
    'static',
    'homework',
    subject,
    homeworkName,
    `${subject}_${homeworkName}_打包时间-${compressTime}.zip`
  )

  // ZIP_LOCAL.zip(needCompressFolderPath, (error, result) => {
  //   if (error) {
  //     console.log('error ------ ' + error);
  //     return
  //   } else {
  //     console.log('result ------ ' + result);
  //     let read = fs.createReadStream(result)
  //     let write = fs.createWriteStream(outputPath)
  //     write.pipe(read)
  //   }
  // })

  try {
    ZIP_LOCAL.sync.zip(needCompressFolderPath).compress().save(outputPath)
  } catch (error) {
    console.log('打包失败，失败原因：' + error);
    Log.add('打包失败，失败原因：' + error);
    return ctx.body = {
      success: false,
      message: '打包失败'
    }
  }

  return (ctx.body = {
    success: true,
    data: {
      success: true,
      message: '打包成功',
      url: `${
        ctx.origin
      }/homework/${subject}/${homeworkName}/${subject}_${homeworkName}_打包时间-${compressTime}.zip`
    }
  })
}

// module.exports.ZIP = async function (ctx) {
//   /** 判断是否登录 */
//   if (!CheckLogin(ctx)) {
//     return (ctx.body = {
//       code: 1004,
//       success: false,
//       message: '未登录'
//     })
//   }

//   if (
//     ctx.request.body.toString().includes('{}') ||
//     !ctx.request.body.subject ||
//     !ctx.request.body.homeworkName
//   ) {
//     return (ctx.body = {
//       success: false,
//       message: '参数错误'
//     })
//   }

//   let {
//     subject,
//     homeworkName
//   } = ctx.request.body

//   // 设置要压缩的格式及压缩级别
//   let archive = archiver('zip', {
//     zlib: {
//       level: 9
//     }
//   })

//   // 设置要压缩的目录/文件夹
//   let needCompressDirPath = path.join(
//     process.cwd(),
//     'static',
//     'homework',
//     subject,
//     homeworkName,
//     'word'
//   )
//   archive.directory(needCompressDirPath, false) // false代表直接压缩,压缩包内不另外建立文件夹

//   // 创建写入流
//   let compressTime = new Date().getTime()
//   let output_path = path.join(
//     process.cwd(),
//     'static',
//     'homework',
//     subject,
//     homeworkName,
//     `${subject}_${homeworkName}_打包时间-${compressTime}.zip`
//   )
//   let output = fs.createWriteStream(output_path)

//   // 执行
//   archive.pipe(output)

//   // 监听错误信息等
//   archive.on('error', function (error) {
//     console.log("压缩时出错，错误如下→" + error);
//   })
//   output.on('error', (error) => {
//     console.log("读取需压缩的文件时出错，错误如下→" + error);
//   })

//   // 结束
//   archive.finalize()

//   return ctx.body = {
//     success: true,
//     data: {
//       success: true,
//       message: '如果下载不成功，请找管理员',
//       url: `${ctx.origin}/homework/${subject}/${homeworkName}/${subject}_${homeworkName}_打包时间-${compressTime}.zip`
//     }
//   }
// }