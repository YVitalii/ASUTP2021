var path="/public/reports/"; //путь к файлам отчетов
const tableBatch=require('./tableBatch'); // модуль таблицы описания тех.процесса
const tableReport=require('./tableFooter'); // модуль таблицы результатов
const PdfPrinter = require('pdfmake');

const fs = require('fs');

var data={};
// ------------- пересчет мм ав рх -----------------------
function mm2px(mm){
  // пересчитывает мм в рх
  // размер листа в 210х297 мм   и 595х841 точек,
  // для первого размера 595/210=2,83 рх/мм, для второго 841/297=2,83 рх/мм
  return Math.round(mm*841/297);
}
// -----------   определяем шрифты   -----------------
var fonts = {
  Roboto: {
    normal: './fonts/Roboto-Regular.ttf',
    bold: './fonts/Roboto-Medium.ttf',
    italics: './fonts/Roboto-Italic.ttf',
    bolditalics: './fonts/Roboto-MediumItalic.ttf'
  }
};
const printer = new PdfPrinter(fonts); // принтер
//-------------  определяем стили ---------------------
const styles={
  tableHeader:{
    bold:true
    ,italics:false
    ,fontSize:9
  }
  ,h1:{
    bold:true
    ,italics:false
    ,fontSize:18
  }
}//styles

function createReport(data){
  // создает файл отчета по входящим данным data
  var docDefinition={};
  docDefinition = {
    // ---------------- document info  ------------------
    info:{
      title:"Heat treatment certificate: "+data.certificate,
      author:"Bortek LTD",
      subject:"Report",
      keywords:"Report thermprocess"
      //,creationDate: (new Date()).toLocaleString()
    },
    pageSize:"A4",
    pageOrientation:"landscape",
    pageMargins:[mm2px(6),mm2px(20),mm2px(6),mm2px(38)], //[left, top, right, bottom]

    // -------------- header  -------------------------------
    header: {
        columns:[
          { width:'auto',
            image:'./public/img/logo_bortekMadesta.png'
            ,margin:[25,25,0,0]
            ,fit:[300/2,52/2]
          },
          {
            width:"*"
            ,text:"\nHEAT TREATMENT CERTIFICATE:"+data.certificate
            ,margin:[5,7,25,0]
            ,style:'h1'
            ,alignment:'right'

          }
        ]
        // space between columns
        ,columnGap: 10

    }, //header*/

    // ------------- footer -----------------------------
    footer:{
       margin:[mm2px(6),mm2px(1),mm2px(6),mm2px(1)] // [left, top, right, bottom]
       ,table:tableReport(data.reports)

    }//footer,

    // --------------  content  --------------------------
    ,content: [
       tableBatch(data),
       {image:data.img,alignment:"center",margin:[0,5,0,5],fit:[300*2.82,300]}
    ],
    // ------------------ defaultStyle ------------------
    defaultStyle: {
       font: 'Roboto'
      ,fontSize:8
      ,italics:true
    },
    styles:styles
  }; //docDefinition
  var pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream(data.path+data.startTime+'.pdf'));
  pdfDoc.end();

} //function createReport(data)

module.exports=createReport;


// -------------------  development  --------------------------
if (! module.parent) {
  path= __dirname+"\\devReports\\"
  console.log("path="+path);
  // -----  данные для отладки -----------------
  data={
    path:__dirname+"\\devReports\\" // путь к папке с отчетами
    ,startTime:"2019-10-14"//new Date().toLocaleDateString()
    ,certificate:"004/19" //
    ,site:"SIA Madesta,Rencēnu iela 8,Riga,LV-1073"
    ,procedure:"GI-8.5_11"

    //Parts
    ,parts:[
         ["Madesta 2019 2441","S355NL+Z25",910,2]
        ,["Madesta 2019 2442","S355NL+Z25",911,2]
      ]
    //samples
    ,samples:[
                 ["5017","55654D3","8163D","1-1","S355NL+Z25"]
                ,["5014","56641B2","6182D","1-1","S355NL+Z25"]
                ,["5013","50642B2","6185D","2-1","S355NL+Z25"]
                ,["5012","50643B2","6186D","2-2","S355NL+Z25"]
                ,["5012","50643B2","6186D","2-2","S355NL+Z25"]
            ]
    ,img:'img.png'  // рисунок должен быть 280мм - по ширине и 100мм по высоте -> 850 x 300 px; 850/300=2.83
    ,reports:[
       ["Start",   50,  "00:00", "22:20:00", "125", "--",  "--",   "--",    "N.Smirnov", "     "]
      ,["Heating", 900, "06:00", "04:20:00", "",    "141", "*C/h", "06:00",  "",          ""]
      ,["Holding", 900, "01:00", "05:45:00", "425", "-5..+7", "*C", "01:25", "",          ""]
      ,["Cooling", 100, " --- ", "09:00:00", "625",  "246", "*C/h", "03:15", "",          ""]
      ,["Cooling", 100, " --- ", "09:00:00", "625",  "246", "*C/h", "03:15", "",          ""]
    ]

  } //data
  // -------------     вызываем рендер  ------------------------
  createReport(data);
}
