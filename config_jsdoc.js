'use strict';
// конфиг для JSdoc
module.exports =
  {
  "plugins": ["plugins/markdown"],
  "source": {
      "include": [ "./db/users.js", "./tools","./public/chart/js", "./routes"  ],
      "exclude": [ "./node_modules" ],
      "includePattern": ".+\\.js(doc|x)?$",
      "excludePattern": "(^|\\/|\\\\)_"
  },
  "sourceType": "module",
  "opts": {
        //"template": "templates/default",  // same as -t templates/default
        "encoding": "utf8",               // same as -e utf8
        "destination": "./public/help/",          // same as -d ./out/
        "recurse": true,                  // same as -r
        //"tutorials": "path/to/tutorials", // same as -u path/to/tutorials
    },
}; //module.exports
