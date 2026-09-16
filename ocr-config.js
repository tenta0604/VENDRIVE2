(function(){
  "use strict";
  var existing=window.VENDRIVE2OCRRelayConfig;
  if(!existing||typeof existing!=="object"){
    window.VENDRIVE2OCRRelayConfig=Object.freeze({
      version:1,
      endpoint:"https://vendrive2-ocr-relay.vercel.app/api/ocr"
    });
  }
  function load(src){var script=document.createElement("script");script.src=src;script.defer=true;document.head.appendChild(script)}
  load("ops10b1-today-tasks.js?v=2026.09.16-FINAL.11");
  load("ops10b1-product-intelligence.js?v=2026.09.16-FINAL.11");
})();