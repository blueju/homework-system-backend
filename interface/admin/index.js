const router = require('koa-router')();

const Db = require('../utils/db.js');
const Log = require('../utils/log.js');
const checkLogin = require('./../utils/checkLogin.js')

router.use('/*', async (ctx, next) => {
  if (ctx.session.type === "student") {
    return ctx.body = {
      code: 403,
      success: false,
      message: '没有权限'
    }
  }
  return next()
})

/**
 * 查看所有作业
 */
router.get('/all-homework', async (ctx, next) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let sql = 'select * from homework';
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
 * 发布作业
 */
const PUBLISH_HOMEWORK = require('./publish-homework.js')
router.post('/publish-homework', PUBLISH_HOMEWORK)

/**
 * 删除作业
 */
const DELETE_HOMEWORK = require('./delete-homework.js')
router.post('/delete-homework', DELETE_HOMEWORK)


/**
 * 修改状态
 */
router.post('/toggle-status', async (ctx) => {
  if (!checkLogin(ctx)) {
    ctx.body = {
      success: false,
      message: '未登录,请先登录'
    }
    return
  }
  let _id = ctx.request.body._id;
  let status = ctx.request.body.status ? 'true' : 'false';
  let sql = 'update homework set `show` = ? where `_id` = ?'
  let data = [status, _id];
  let result = await Db.update(sql, data);
  if (result.affectedRows === 1) {
    return ctx.body = {
      success: true,
      message: '切换状态成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '切换状态失败'
    }
  }
})


/**
 * 修改作业
 */
router.post('/alter-homework', async (ctx, next) => {
  /** 判断是否登录 */
  if (!checkLogin(ctx)) {
    return ctx.body = {
      code: 1004,
      success: false,
      message: '未登录'
    }
  }

  let {
    _id,
    subject,
    homeworkName,
    deadline,
    remark,
    teacher,
    template_path,
    suffix,
  } = ctx.request.body;
  let sql = 'update homework set `subject`=?,`homework_name`=?,`deadline`=?,`remark`=?,`teacher`=?,`template_path`=?,`suffix`=? where `_id` =?'
  let data = [subject, homeworkName, deadline, remark, teacher, template_path, suffix, _id]
  let result = await Db.add(sql, data)
  if (result.affectedRows === 1) {
    Log.add(ctx, `修改了作业`)
    return ctx.body = {
      success: true,
      message: '作业修改成功'
    }
  } else {
    return ctx.body = {
      success: false,
      message: '作业修改失败'
    }
  }
})

const NOTICE = require('./notice.js')
router.post('/notice', NOTICE.ADD_NOTICE)
router.delete('/notice', NOTICE.DELETE_NOTICE)
// router.get('/notice', NOTICE.GET_NOTICE)

// 下载作业模块（此下载作业非彼下载作业）
const DOWNLOAD_HOMEWORK = require('./download-homework.js')
router.get('/submit-detail', DOWNLOAD_HOMEWORK.GET)
router.post('/zip', DOWNLOAD_HOMEWORK.ZIP)


module.exports = router;