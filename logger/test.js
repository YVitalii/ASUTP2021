const {open} =require ("fs/promises");

async function  appendLine (fName,line) {
  open(fName,"ax")
    .then(
      async fh => {
        // создаем новый файл
        console.log("Создаем новый файл");
        await fh.write("12345");
        return fh;
        //return
      },
      error => {
        if (error.code === "EEXIST") {
          // файл существует, дописываем в него строку данных
          console.log("Файл существует");
          return open(fName,"a");
        }
      }
    )
    .then (
      async (fh) => {
        console.log("fh=",fh);
        await fh.write(line);
        await fh.close();
      }
    ) ;

}; //appendLine

// ---------------  тестирование -----------------------
if (! module.parent) {
  let fName="F:/node/ASUTP2021/logger/12345.txt";
  //console.dir(conf);
  appendLine(fName,"\nooooo12345");
}
