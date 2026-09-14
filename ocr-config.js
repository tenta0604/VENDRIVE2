(function(){
  "use strict";
  var existing=window.VENDRIVE2OCRRelayConfig;
  if(!existing||typeof existing!=="object"){
    window.VENDRIVE2OCRRelayConfig=Object.freeze({
      version:1,
      endpoint:"https://vendrive2-ocr-relay.vercel.app/api/ocr"
    });
  }
  if(!document.querySelector('script[data-vendrive-sales-review]')){
    var script=document.createElement("script");
    script.src="./sales-review.js";
    script.async=false;
    script.dataset.vendriveSalesReview="1";
    document.head.appendChild(script);
  }
})();
