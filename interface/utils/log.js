const Db = require('./db.js')
const requestIp = require('request-ip');

function Log() {

}

Log.prototype.getInstance = function () {
  if (!this.instance) {
    this.instance = new Log();
  }
  return this.instance;
}

Log.prototype.add = async function (ctx, content) {
  let {
    userId,
    userName
  } = ctx.session;
  let ip = requestIp.getClientIp(ctx);
  let sql = `INSERT INTO log VALUES (NULL,?,?,?,?,CURRENT_TIMESTAMP);`
  let data = [userId, userName, ip, `${userId} ${userName} ${content}`]
  let result = await Db.add(sql, data);
  if (result.affectedRows === 0) {
    console.log(`✘ 日志未成功录入数据库，内容为：${userId} ${userName} ${content}`);
  } else {
    console.log(`✔ 日志已经成功录入数据库，内容为：${userId} ${userName} ${content}`);
  }
}

Log.prototype.err = async function (content) {
  let sql = `INSERT INTO err VALUES (NULL,?,CURRENT_TIMESTAMP);`
  let data = [content]
  let result = await Db.add(sql, data);
  if (result.affectedRows === 0) {
    console.log(`✘ 错误日志未成功录入数据库，内容为：${content}`);
  } else {
    console.log(`✔ 错误日志已经成功录入数据库，内容为：${content}`);
  }
}

module.exports = Log.prototype.getInstance()