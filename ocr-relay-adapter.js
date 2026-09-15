(function(){
  "use strict";
  var config=window.VENDRIVE2OCRRelayConfig;
  if(!config||config.version!==1||typeof config.endpoint!=="string"||!config.endpoint.trim())return;
  var endpoint=config.endpoint.trim(),MAX_RELAY_BYTES=4*1024*1024;
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
  function assertAnalyzeInput(input){
    if(!input||typeof input!=="object")fail("OCR analyze input is required");
    var file=input.file;
    if(!(file instanceof Blob))fail("OCR image file is required");
    if(!file.type||file.type.indexOf("image/")!==0)fail("OCR file must be an image");
    if(typeof file.size!=="number"||file.size<1)fail("OCR image is empty");
    if(file.size>MAX_RELAY_BYTES)fail("OCR送信用画像は4MB以下にしてください。選択画像自体は保存されていません。");
    if(!Array.isArray(input.supportedReportTypes)||!input.supportedReportTypes.length)fail("supportedReportTypes is required");
    return file;
  }
  async function analyze(input){
    var file=assertAnalyzeInput(input),form=new FormData(),controller=new AbortController(),timer=setTimeout(function(){controller.abort()},75000);
    form.append("file",file,file.name||"report-image");
    form.append("supportedReportTypes",JSON.stringify(input.supportedReportTypes));
    if(input.image&&typeof input.image==="object")form.append("imageMetadata",JSON.stringify({name:input.image.name||null,mime:input.image.mime||file.type,size:input.image.size||file.size,lastModified:input.image.lastModified||null}));
    try{
      var response=await fetch(endpoint,{method:"POST",body:form,headers:{Accept:"application/json"},credentials:"omit",cache:"no-store",redirect:"error",signal:controller.signal});
      var length=Number(response.headers.get("content-length")||0);
      if(length>262144)fail("OCR relay response is too large");
      var text=await response.text();
      if(text.length>262144)fail("OCR relay response is too large");
      var payload;
      try{payload=JSON.parse(text)}catch(error){fail("OCR relay returned invalid JSON")}
      if(!response.ok){var message=payload&&typeof payload.error==="string"?payload.error:"OCR relay request failed",code=payload&&typeof payload.code==="string"?payload.code:"relay_request_failed",retryable=payload&&typeof payload.retryable==="boolean"?payload.retryable:false;fail(message,code,retryable,response.status)}
      return payload;
    }catch(error){
      if(error&&error.name==="AbortError")fail("OCR relay request timed out","relay_timeout",true,504);
      throw error;
    }finally{clearTimeout(timer)}
  }
  window.VENDRIVE2OCRAdapter=Object.freeze({version:1,transport:"secure-relay",maxUploadBytes:MAX_RELAY_BYTES,analyze:analyze});
})();
