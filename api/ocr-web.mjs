import handler from "./ocr.mjs";

export async function POST(request){
  return handler.fetch(request);
}

export async function OPTIONS(request){
  return handler.fetch(request);
}
