function reqGetParam(req, key = "") {
  let value = req.query[key] ? req.query[key] : undefined;
  if (value === undefined) {
    value = req.body[key] ? req.body[key] : undefined;
  }
  return value;
}

function reqGetFileName(req) {
  return reqGetParam(req, "fileName");
}

module.exports.reqGetParam = reqGetParam;
module.exports.reqGetFileName = reqGetFileName;

// let trace = 0;

// if (trace) {
//   let req = { query: {}, body: {} };
//   console.log("reqGetFileName(req)=" + reqGetFileName(req));

//   req.query = {
//     fileName: "firstFile.js",
//     value: "queryValue",
//   };
//   console.log("reqGetFileName(req)=" + reqGetFileName(req));
//   console.log(`reqGetParam(req,"value")=` + reqGetParam(req, "value"));
//   console.log(`reqGetParam(req,"value2")=` + reqGetParam(req, "value2"));
//   req.body = {
//     value2: "bodyValue",
//   };
//   console.log(`reqGetParam(req,"value2")=` + reqGetParam(req, "value2"));
// }
