(function(){
  "use strict";
  var config=window.VENDRIVE2OCRRelayConfig;
  if(!config||config.version!==1||typeof config.endpoint!=="string"||!config.endpoint.trim())return;
  var endpoint=config.endpoint.trim(),MAX_RELAY_BYTES=4*1024*1024,MAX_SOURCE_BYTES=12*1024*1024,OPTIMIZE_THRESHOLD=900*1024,MAX_EDGE=2200,JPEG_QUALITY=.86;
  function validEndpoint(value){
    try{
      var url=new URL(value,window.location.href);
      if(url.protocol==="https:")return true;
      return (url.hostname==="localhost"||url.hostname==="127.0.0.1")&&url.protocol==="http:";
    }catch(error){return false}
  }
  if(!validEndpoint(endpoint)){
    if(window.console&&console.warn)console.warn("VENDRIVE2 OCR relay endpoint is invalid");
    return;
  }
  function fail(message,code,retryable,status){var error=new Error(message);if(code)error.code=code;if(typeof retryable==="boolean")error.retryable=retryable;if(typeof status==="number")error.status=status;throw error}
  function notify(input,stage,detail){try{if(input&&typeof input.onProgress==="function")input.onProgress(Object.assign({stage:stage},detail||{}))}catch(error){}}
  function assertAnalyzeInput(input){
    if(!input||typeof input!=="object")fail("OCR analyze input is required");
    var file=input.file;
    if(!(file instanceof Blob))fail("OCR image file is required");
    if(!file.type||file.type.indexOf("image/")!==0)fail("OCR file must be an image");
    if(typeof file.size!=="number"||file.size<1)fail("OCR image is empty");
    if(file.size>MAX_SOURCE_BYTES)fail("OCR画像は12MB以下にしてください。画像は保存されていません。","source_too_large",false,413);
    if(!Array.isArray(input.supportedReportTypes)||!input.supportedReportTypes.length)fail("supportedReportTypes is required");
    return file;
  }
  function blobFromCanvas(canvas,quality){return new Promise(function(resolve){canvas.toBlob(resolve,"image/jpeg",quality)})}
  async function decodeImage(file){
    if(typeof createImageBitmap==="function"){
      try{var bitmap=await createImageBitmap(file);return {source:bitmap,width:bitmap.width,height:bitmap.height,close:function(){try{bitmap.close()}catch(error){}}}}catch(error){}
    }
    if(typeof document==="undefined")return null;
    return new Promise(function(resolve,reject){
      var url=URL.createObjectURL(file),img=new Image();
      img.onload=function(){URL.revokeObjectURL(url);resolve({source:img,width:img.naturalWidth,height:img.naturalHeight,close:function(){}})};
      img.onerror=function(){URL.revokeObjectURL(url);reject(new Error("Image decode failed"))};
      img.src=url;
    });
  }
  async function prepareUpload(file,input){
    notify(input,"prepare",{originalBytes:file.size});
    if(typeof document==="undefined"||typeof document.createElement!=="function"){
      if(file.size>MAX_RELAY_BYTES)fail("OCR送信用画像を4MB以下に軽量化できませんでした。","optimization_failed",true,413);
      return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:null,height:null};
    }
    var decoded=null;
    try{decoded=await decodeImage(file)}catch(error){
      if(file.size<=MAX_RELAY_BYTES)return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:null,height:null};
      fail("OCR送信用画像を軽量化できませんでした。画像は保存されていません。","optimization_failed",true,413);
    }
    if(!decoded){
      if(file.size<=MAX_RELAY_BYTES)return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:null,height:null};
      fail("OCR送信用画像を軽量化できませんでした。画像は保存されていません。","optimization_failed",true,413);
    }
    var longest=Math.max(decoded.width,decoded.height),scale=Math.min(1,MAX_EDGE/longest);
    if(file.size<OPTIMIZE_THRESHOLD&&scale===1){decoded.close();return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:decoded.width,height:decoded.height}}
    notify(input,"optimizing",{originalBytes:file.size,width:decoded.width,height:decoded.height});
    var width=Math.max(1,Math.round(decoded.width*scale)),height=Math.max(1,Math.round(decoded.height*scale)),canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    var ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx){decoded.close();if(file.size<=MAX_RELAY_BYTES)return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:decoded.width,height:decoded.height};fail("画像の軽量化に失敗しました。","optimization_failed",true,413)}
    ctx.fillStyle="#fff";ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(decoded.source,0,0,width,height);decoded.close();
    var blob=await blobFromCanvas(canvas,JPEG_QUALITY);
    if(blob&&blob.size>MAX_RELAY_BYTES)blob=await blobFromCanvas(canvas,.76);
    if(!blob||blob.size<1||blob.size>MAX_RELAY_BYTES){
      if(file.size<=MAX_RELAY_BYTES)return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:width,height:height};
      fail("OCR送信用画像を4MB以下に軽量化できませんでした。","optimization_failed",true,413);
    }
    var worthwhile=blob.size<file.size*.92||file.size>MAX_RELAY_BYTES||scale<1;
    if(!worthwhile&&file.size<=MAX_RELAY_BYTES)return {blob:file,name:file.name||"report-image",originalBytes:file.size,uploadBytes:file.size,optimized:false,width:decoded&&decoded.width||width,height:decoded&&decoded.height||height};
    return {blob:blob,name:(file.name||"report-image").replace(/\.[^.]+$/,"")+".jpg",originalBytes:file.size,uploadBytes:blob.size,optimized:true,width:width,height:height};
  }
  async function analyze(input){
    var file=assertAnalyzeInput(input),prepared=await prepareUpload(file,input),form=new FormData(),controller=new AbortController(),timer=setTimeout(function(){controller.abort()},75000);
    notify(input,"upload_ready",{originalBytes:prepared.originalBytes,uploadBytes:prepared.uploadBytes,optimized:prepared.optimized,width:prepared.width,height:prepared.height});
    form.append("file",prepared.blob,prepared.name);
    form.append("supportedReportTypes",JSON.stringify(input.supportedReportTypes));
    if(input.image&&typeof input.image==="object")form.append("imageMetadata",JSON.stringify({name:input.image.name||null,mime:input.image.mime||file.type,size:input.image.size||file.size,lastModified:input.image.lastModified||null,uploadBytes:prepared.uploadBytes,optimized:prepared.optimized,width:prepared.width,height:prepared.height}));
    try{
      notify(input,"ocr_wait",{originalBytes:prepared.originalBytes,uploadBytes:prepared.uploadBytes,optimized:prepared.optimized});
      var response=await fetch(endpoint,{method:"POST",body:form,headers:{Accept:"application/json"},credentials:"omit",cache:"no-store",redirect:"error",signal:controller.signal});
      var length=Number(response.headers.get("content-length")||0);
      if(length>262144)fail("OCR relay response is too large");
      var text=await response.text();
      if(text.length>262144)fail("OCR relay response is too large");
      var payload;
      try{payload=JSON.parse(text)}catch(error){fail("OCR relay returned invalid JSON")}
      if(!response.ok){var message=payload&&typeof payload.error==="string"?payload.error:"OCR relay request failed",code=payload&&typeof payload.code==="string"?payload.code:"relay_request_failed",retryable=payload&&typeof payload.retryable==="boolean"?payload.retryable:false;fail(message,code,retryable,response.status)}
      notify(input,"complete",{originalBytes:prepared.originalBytes,uploadBytes:prepared.uploadBytes,optimized:prepared.optimized});
      return payload;
    }catch(error){
      if(error&&error.name==="AbortError")fail("OCR relay request timed out","relay_timeout",true,504);
      throw error;
    }finally{clearTimeout(timer)}
  }
  window.VENDRIVE2OCRAdapter=Object.freeze({version:1,transport:"secure-relay",maxUploadBytes:MAX_RELAY_BYTES,maxSourceBytes:MAX_SOURCE_BYTES,optimizeMaxEdge:MAX_EDGE,analyze:analyze});
})();