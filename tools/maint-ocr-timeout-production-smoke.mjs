import {deflateSync} from "node:zlib";
function crc32(buf){
  let c=0xffffffff;
  for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}
  return (c^0xffffffff)>>>0;
}
function chunk(type,data){
  const t=Buffer.from(type),out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);
  return out;
}
function receiptLikePng(width=1200,height=1800){
  const stride=width+1,raw=Buffer.alloc(stride*height);let seed=0x12345678;
  function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed&255}
  for(let y=0;y<height;y++){
    const row=y*stride;raw[row]=0;
    for(let x=0;x<width;x++){
      const receipt=x>170&&x<1030&&y>80&&y<1720;
      let v=receipt?235:35;
      if(receipt){
        const band=y>180&&y<1600&&((y%52)<8);
        const column=(x>250&&x<940);
        if(band&&column)v=45+(rnd()%40);else v=Math.max(180,Math.min(255,v+(rnd()%35)-17));
      }else v=Math.max(8,Math.min(70,v+(rnd()%35)-17));
      raw[row+1+x]=v;
    }
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=0;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:6})),chunk("IEND",Buffer.alloc(0))]);
}
const endpoint="https://vendrive2-ocr-relay.vercel.app/api/ocr",png=receiptLikePng();
if(png.length<1000000||png.length>3900000)throw new Error("realistic smoke image size out of range: "+png.length);
console.log("OCR_REALISTIC_IMAGE",JSON.stringify({bytes:png.length,width:1200,height:1800}));
async function once(n){
  const form=new FormData();
  form.append("file",new Blob([png],{type:"image/png"}),"receipt-like.png");
  form.append("supportedReportTypes",JSON.stringify(["sales","input","recovery","input_recovery"]));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),80000);
  const started=Date.now();
  try{
    const response=await fetch(endpoint,{method:"POST",headers:{Origin:"https://tenta0604.github.io",Accept:"application/json"},body:form,signal:controller.signal});
    const text=await response.text();let body=null;try{body=JSON.parse(text)}catch{}
    console.log("OCR_REALISTIC_PRODUCTION_SMOKE",JSON.stringify({attempt:n,status:response.status,elapsedMs:Date.now()-started,code:body&&body.code||null,provider:body&&body.provider||null}));
    if(response.status!==200||!body||body.provider!=="google-gemini-api")throw new Error("realistic production OCR smoke failed");
  } finally {clearTimeout(timer)}
}
await once(1);
await new Promise(r=>setTimeout(r,2000));
await once(2);
console.log("OCR_REALISTIC_PRODUCTION_SMOKE_PASS");
