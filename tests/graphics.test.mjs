import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadGraphics,applyGraphics,drawGraphic} from '../graphics.js';
const info={frontFile:'hills/1-front.png',backFile:'hills/1-back.png'};
function image(file){const b=fs.readFileSync(new URL('../assets/'+file,import.meta.url));return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}
test('both graphics sets load using relative asset paths with validated sizes',async()=>{
 for(const scale of [1,4]){
  const paths=[];const g=await loadGraphics(info,scale,async file=>{paths.push(file);return image(file);});
  assert.equal(g.scale,scale);assert.equal(paths[0],(scale===4?'upscaled/nearest-4x/':'')+info.frontFile);
 }
});
test('every hill has matching 4x foreground and background dimensions',()=>{
 const scene=JSON.parse(fs.readFileSync(new URL('../assets/scene.json',import.meta.url)));
 for(const file of [...scene.hills.flatMap(h=>[h.frontFile,h.backFile]),'animations.png']){
  const original=image(file),upscaled=image('upscaled/nearest-4x/'+file);
  assert.deepEqual(upscaled,{width:original.width*4,height:original.height*4},file);
 }
});
test('failed or invalid graphics loads reject without installing a partial set',async()=>{
 await assert.rejects(loadGraphics(info,4,async()=>({width:1,height:1})),/dimensions/);
 await assert.rejects(loadGraphics(info,4,async()=>{throw new Error('Missing image');}),/Missing image/);
});
test('4x sprite and camera crops preserve logical destination coordinates',()=>{
 const calls=[],ctx={drawImage:(...args)=>calls.push(args)},atlas={};
 drawGraphic(ctx,atlas,4,96,72,17,23,100,80,17,23);
 assert.deepEqual(calls[0],[atlas,384,288,68,92,100,80,17,23]);
 drawGraphic(ctx,atlas,4,200,100,320,200,0,0,320,200);
 assert.deepEqual(calls[1],[atlas,800,400,1280,800,0,0,320,200]);
});
test('switching resolution restores transforms and pixel sampling in both directions',()=>{
 const canvas={},transforms=[],ctx={setTransform:(...args)=>transforms.push(args)};
 for(const scale of [4,1]){applyGraphics(canvas,ctx,{scale});assert.equal(canvas.width,320*scale);assert.equal(canvas.height,200*scale);assert.equal(ctx.imageSmoothingEnabled,false);}
 assert.deepEqual(transforms,[[4,0,0,4,0,0],[1,0,0,1,0,0]]);
});
