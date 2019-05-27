const formidable = require("formidable");
const path = require('path');
const fs = require('fs');

module.exports = function (data, ) {
  let {
    subject,
    homeworkName,
  } = data;
  let targetPath = path.join(process.cwd(), 'static', subject, homeworkName, 'word');

  let form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.keepExtensions = true;
  form.uploadDir = path.join();
}