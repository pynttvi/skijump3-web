// SPDX-License-Identifier: GPL-3.0
export async function loadGraphics(info,scale,loadImage){
 const prefix=scale===4?'upscaled/nearest-4x/':'';
 const [front,back,atlas]=await Promise.all([info.frontFile,info.backFile,'animations.png'].map(file=>loadImage(prefix+file)));
 for(const [image,width,height] of [[front,1024,512],[back,1024,400],[atlas,1536,864]]){
  if(image.width!==width*scale||image.height!==height*scale)throw new Error('Unexpected graphics dimensions');
 }
 return {front,back,atlas,scale};
}
export function applyGraphics(canvas,ctx,graphics){
 canvas.width=320*graphics.scale;canvas.height=200*graphics.scale;
 ctx.setTransform(graphics.scale,0,0,graphics.scale,0,0);ctx.imageSmoothingEnabled=false;
}
export function drawGraphic(ctx,image,scale,sx,sy,sw,sh,dx,dy,dw,dh){
 ctx.drawImage(image,sx*scale,sy*scale,sw*scale,sh*scale,dx,dy,dw,dh);
}
