const mysql = require('mysql')
const rootPath = process.cwd()
console.log(rootPath);


/** 数据库配置导入 */
const {
  dbConfig
} = require(`${rootPath}/config.js`)

/** 数据库连接池 */
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  dateStrings: true
})

class Database {

  static getInstance() {
    if (Database.instance) {
      return Database.instance;
    } else {
      Database.instance = new Database();
      return Database.instance;
    }
  }

  constructor() {
    // this.instance = "";
    this.dbConnection = ""; /** 用于保存数据库连接 */
    this.getConnection(); /** 实例化时就从数据库连接池获取连接 */
  }

  /** 从数据库池获取连接 */
  getConnection() {
    return new Promise((resolve, reject) => {
      /** 如果数据库连接已经存在，则直接返回，否则去数据库池获取连接 */
      if (this.dbConnection) {
        resolve(this.dbConnection); /** 数据库连接已存在，直接返回 */
      } else {
        pool.getConnection((err, connection) => {
          if (err) {
            console.log(err);
            console.log('创建数据库连接池失败/从数据库池获取连接失败');
            // return
          } else {
            console.log('创建数据库连接池成功/从数据库池获取连接成功');
            this.dbConnection = connection;
            resolve(connection);
            /** 保存数据库连接，并返回 */
          }
        })
      }
    })
  }

  /**
   * 增
   * @param {*} sql SQL语句
   * @param {*} data SQL语句中的数据
   */
  add(sql, data) {
    return new Promise((resolve, reject) => {
      this.getConnection().then((dbConnection) => {
        dbConnection.query(sql, data, (err, results, fields) => {
          if (err) {
            console.log(err);
            reject('数据库增加数据失败');
            // return
          } else {
            resolve(results); /** 返回结果 */
          }
        })
      })
    })
  }

  /**
   * 删
   * @param {*} sql SQL语句
   * @param {*} data SQL语句中的数据
   */
  del(sql, data) {
    return new Promise((resolve, reject) => {
      this.getConnection().then((dbConnection) => {
        dbConnection.query(sql, data, (err, results, fields) => {
          if (err) {
            console.log(err);            
            reject('数据库删除数据失败');
            // return
          } else {
            resolve(results); /** 返回结果 */
          }
        })
      })
    })
  }

  /**
   * 改
   * @param {*} sql SQL语句
   * @param {*} data SQL语句中的数据
   */
  update(sql, data) {
    return new Promise((resolve, reject) => {
      this.getConnection().then((dbConnection) => {
        dbConnection.query(sql, data, (err, results, fields) => {
          if (err) {
            console.log(err);
            reject('数据库修改数据失败');
            // return
          } else {
            resolve(results); /** 返回结果 */
          }
        })
      })
    })
  }

  /**
   * 查
   * @param {*} sql SQL语句
   * @param {*} data SQL语句中的数据
   */
  find(sql, data) {
    return new Promise((resolve, reject) => {
      this.getConnection().then((dbConnection) => {
        dbConnection.query(sql, data, (err, results, fields) => {
          if (err) {
            console.log(err);
            reject('查询数据失败')
            // return
          } else {
            resolve(results) /** 返回结果 */
          }
        })
      })
    })
  }

}

/** 导出数据库操作类 */
// module.exports = {
//   Database
// };
module.exports = Database.getInstance()