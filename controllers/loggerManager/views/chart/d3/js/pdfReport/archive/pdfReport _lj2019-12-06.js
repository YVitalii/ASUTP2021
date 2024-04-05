
function mm2px(mm){
  return Math.round(mm*841/297);
}

var fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Medium.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-MediumItalic.ttf'
  }
};

const styles:{
  tableHeader:{
    bold:true
    italics:false
  }
  
}


const captions={
  certificate:{text:"Heat treatment sertificate: ", style:"H1"}
  ,site:{text:"Heat treatment site: ",style:"captions"}
  ,startTime:{text:"Process start time: ",style:"caption"}
  ,procedure:{text:"Heat treatment procedure: ",style:"caption"}
  ,batch:{
       columnsWidth:[20,    " *",    "auto",     "auto",  30,  20,"auto","auto","auto","auto","auto"  ]
      ,parts:[      "N","Part item","Material","Weight","Qty"]
      ,samples:["N","samp no","heat no","part no","list no","Material"]
      }
 ,process:{
      setParameters:{}
 }
}

//phases:["Heating","Holding","Cooling"]
const data={
   startTime:"2019-10-14"//new Date().toLocaleDateString()
  ,Certificate:"004/19"
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
          ]
  ,img:'img.png'
  ,operator:"N.Smirnov"
}


var PdfPrinter = require('pdfmake');
var printer = new PdfPrinter(fonts);
var fs = require('fs');

var docDefinition = {
  info:{
    title:"Отчет",
    author:"Виталий",
    subject:"Report",
    keywords:"Report thermprocess"
  },
  pageSize:"A4",
  pageOrientation:"landscape",
  pageMargins:[mm2px(6),mm2px(20),mm2px(6),mm2px(20)], //[left, top, right, bottom]
  /*header: {
    columns:[
      {
        image:'./public/img/logo_bortek.png'
        ,margin:[5,5,0,0]
      }

      ,{
        width:'*',
        text:"simple text",
        align:"center",
        margin:[mm2px(5),mm2px(20),mm2px(5),mm2px(5)] // [left, top, right, bottom]
      }
    ]


  }, //header*/
  footer:{
     margin:[mm2px(6),mm2px(1),mm2px(6),mm2px(1)] // [left, top, right, bottom]
    ,table:{
        widths:["*","auto"],
        body:[
          [
            {text:[{text:"Примечания:",bold:true},{text:data.note,italics:true}],fontSize:12}
           ,{text:[{text:"Работу принял/непринял:\n",bold:true},{text:data.inspector+ "  _______________",italics:true}],fontSize:12}
          ] //row1

        ]
      }//table

  }//footer,

  ,content: [
    {
      table:{
        widths:[100,190,100,"*"]
        ,body: [
          [{rowSpan:2,image:'./public/img/logo_bortek.png',aligment:"center"},{rowSpan:2,image:'./public/img/logo_madesta.png',aligment:"center"},{text:"Дата", alignment: 'center', italics: true, fontSize: 14},{text:[{text:"Исполнитель:  ",bold:true},{text:data.user+"      ____________", alignment: 'center', italics: true}],fontSize: 12}]
         ,["","",{text:data.date, alignment: 'center', italics: true, fontSize: 14},[{text:"Описание:",bold: true},{text:data.description,italics: true}]]
        ]
      }
    }
    //, {text:"Запись температурного режима", alignment: 'center', italics: true, fontSize: 14}


    ,{
      // under NodeJS (or in case you use virtual file system provided by pdfmake)
      // you can also pass file names here
      image: 'img.png'

      ,align:'center'
    }
  ],
  defaultStyle: {
     font: 'Roboto'
    ,fontSize:12
    ,italics:true
  }
};

var pdfDoc = printer.createPdfKitDocument(docDefinition);
pdfDoc.pipe(fs.createWriteStream('document.pdf'));
pdfDoc.end();
