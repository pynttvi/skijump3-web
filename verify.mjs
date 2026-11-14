import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2]??'.');
const {createJump,stepJump,assistInput}=await import(pathToFileURL(path.join(root,'simulation.js')));
const scene=JSON.parse(fs.readFileSync(path.join(root,'assets/scene.json'),'utf8'));
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const provenance=JSON.parse(fs.readFileSync(path.join(root,'asset-provenance.json')));
for(const [file,digest] of Object.entries(provenance.outputs))assert.equal(sha(fs.readFileSync(path.join(root,'assets',file))),digest,file);
const original=JSON.parse(fs.readFileSync(path.join(root,'source/upstream-provenance.json')));
for(const [file,digest] of Object.entries(original.files))assert.equal(sha(fs.readFileSync(path.join(root,file))),digest,file);
const base=new URL('https://example.github.io/skijump3-web/');
for(const [,link] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/(?:href|src)="([^"]+)"/g)){
 const url=new URL(link,base);assert.ok(url.pathname.startsWith(base.pathname));
 if(link.endsWith('.tar.gz')&&root===path.resolve('.'))continue;
 assert.ok(fs.existsSync(path.join(root,url.pathname.slice(base.pathname.length))),link);
}
const results=[];
for(const hillInfo of scene.hills){
 const hill=JSON.parse(fs.readFileSync(path.join(root,'assets/hills',hillInfo.id+'.json'),'utf8'));
 if(!hill.profileVerified)throw new Error('Profile was not verified');
 const run=()=>{const state=createJump(hill,1979);while(state.phase!=='result'&&state.ticks<2600)stepJump(state,assistInput(state));return state;};
 const a=run(),b=run();
 if(a.phase!=='result'||!a.result||![a.x,a.y,a.px,a.result.length,a.result.points].every(Number.isFinite))throw new Error(`Incomplete or invalid jump: ${hillInfo.name}`);
 if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('Nondeterministic replay');
 results.push({hill:hillInfo.name,length:a.result.length,points:a.result.points,fall:a.result.fall,takeoff:a.result.takeoff,ticks:a.ticks,deterministic:true});
}
console.log(JSON.stringify({hills:results.length,results,allProfileChecksumsMatch:true,browserRendered:false,runtimeParity:'not_measured'}));
