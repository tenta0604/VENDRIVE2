import { POST as ocrPOST, OPTIONS as ocrOPTIONS } from "./ocr.mjs";

export async function POST(request){
  return ocrPOST(request);
}

export async function OPTIONS(request){
  return ocrOPTIONS(request);
}
