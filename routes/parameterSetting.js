var express = require('express');
var router = express.Router();
let config = require('../config.js'); // config.js
let thisFurnace = {};
const fs = require('fs');
// console.log("Содержимое папки params:");
// fs.readdirSync("./public/params/").forEach(file => {
//     console.log(file);
// });
// fs.readFile('./public/params/SNO-658-11/1.log', 'utf8' , (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   console.log(data)
// })

/* GET parameters page. */
router.get('/:furnace', function(req, res, next) {
  let userData = req.user
  // console.log("UserData: ", userData);
  const id = req.params.furnace;
  config.entities.forEach(furnace => {
    // console.log(furnace);
    if (req.params.furnace == furnace.id) {
		  thisFurnace = furnace;
    }
  });
  const path = "./public/params/"+id;
  let fileList = [];
  fs.readdirSync(path).forEach(file => {
    // console.log("- - - - - - - - - - - -");
    // console.log(path+'/'+file);
    // console.log("- - - - - - - - - - - -");
    fs.readFile(path+'/'+file, function (err, data) {
      if (err) throw err;
      // console.log(JSON.stringify(data));
    });
    fileList.push(file);
  });
  res.render('parameterSetting', {furnace: thisFurnace, fileList: fileList, userData});
});

module.exports = router;