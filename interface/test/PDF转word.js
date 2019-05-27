const path = require("path");
const fs = require("fs");

const router = require("koa-router")();
const bodyBodyparser = require('koa-bodyparser');

const word2pdf = require("word2pdf");

const ROOT_PATH = process.cwd();

const {
  rootPath,
  port
} = require('./../../config.js');
console.log(ROOT_PATH);

const Db = require(`${ROOT_PATH}/publicMethods/db.js`)

// 获取作业网址
async function getHomeworkUrl(subject, homeworkName, studentId) {
  let wordPath = path.join(rootPath, 'static', 'homework', subject, homeworkName, 'word', studentId) + '.docx';
  // let fileData = await word2pdf(wordPath); //11K Word文件 转换成PDF大致需 11秒
  let pdfPath = path.join(rootPath, 'static', 'homework', subject, homeworkName, 'pdf', studentId) + '.pdf';
  fs.writeFileSync(pdfPath, fileData);
  let homeworkUrl = `http://localhost:${port}/homework/${subject}/${homeworkName}/pdf/${studentId}.pdf`;
  return homeworkUrl
}

router.get("/getHomeworkUrl", async (ctx, next) => {
  let subject = ctx.request.query.subject
  let homeworkName = ctx.request.query.homeworkName
  let studentId = ctx.request.query.studentId
  let homeworkUrl = await getHomeworkUrl(subject, homeworkName, studentId)
  console.log(homeworkUrl);


  // const data = await word2pdf("interface/test/test.docx");
  // console.log(data);
  // fs.writeFileSync("interface/test/test.pdf", data);
  // console.log("ok");
  // ctx.body = {
  //   code: "1"
  // };
});

router.post('/mysql', async (ctx, next) => {
  let sql = 'DELETE FROM test WHERE one = "3"';
  let data = null;
  let result = await Db.del(sql, data)
  console.log(result);

})

module.exports = router;
