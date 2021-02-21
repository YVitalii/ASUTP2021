const fs = require('fs');


function getFiles(path) {
    fs.readdir(path,(err,files) => {
      files.sort();
      files.reverse();
      console.dir(files);
    });
} // getFiles

if (! module.parent) {
  let path="F:/node/ASUTP2021/public/logs/SSHCM-8-15-10";//__dirname;
  console.log("path="+path);
  getFiles(path);
}
