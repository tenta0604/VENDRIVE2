(function(){
  "use strict";
  var existing=window.VENDRIVE2OCRRelayConfig;
  if(existing&&typeof existing==="object")return;
  window.VENDRIVE2OCRRelayConfig=Object.freeze({
    version:1,
    endpoint:"https://vendrive2-ocr-relay.vercel.app/api/ocr"
  });
})();
