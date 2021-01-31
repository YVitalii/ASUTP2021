function parseBuf(val) {
  //console.log("TypeOf data: "+ typeOf(data));
  let str='';
  if (Buffer.isBuffer(val)) {
     str+=val.toString('hex')
  } else {
    str+=val
  }
  let line="";
  let i=0;
  if (str.length>3){
    for (i = 0; i < (str.length-2); i+=2) {
      line+=str[i]+str[i+1]+"-";
    }
  }
  line+=str.slice(i);
  return "0x[ "+line+ " ]"
}
 module.exports=parseBuf;
