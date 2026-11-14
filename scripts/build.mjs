// SPDX-License-Identifier: GPL-3.0
// Dependency-free static packaging; editable source stays in the repository root.
import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'dist');
if(fs.existsSync(output)&&fs.lstatSync(output).isSymbolicLink())throw new Error('dist must not be a symlink');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
for(const name of ["assets","source","index.html","canvas.css","game.js","simulation.js","ui.js","serve.mjs","verify.mjs","package.json","README.md","COPYING","CREDITS.TXT","THIRD_PARTY_NOTICES.md","asset-provenance.json","build-report.json"])fs.cpSync(path.join(root,name),path.join(output,name),{recursive:true});
fs.writeFileSync(path.join(output,'.nojekyll'),'');
const archive=[];
function addSource(name) {
  const input=path.join(root,name),stat=fs.lstatSync(input);
  if(stat.isSymbolicLink())throw new Error('Source archive paths must not be symlinks');
  if(stat.isDirectory()) {
    for(const child of fs.readdirSync(input).sort())addSource(`${name}/${child}`);
    return;
  }
  if(!stat.isFile()||Buffer.byteLength(name)>100)throw new Error(`Unsupported source archive path: ${name}`);
  const data=fs.readFileSync(input),header=Buffer.alloc(512);
  const octal=(offset,length,value)=>header.write(value.toString(8).padStart(length-1,'0')+'\0',offset,length,'ascii');
  header.write(name);octal(100,8,0o644);octal(108,8,0);octal(116,8,0);
  octal(124,12,data.length);octal(136,12,0);header.fill(32,148,156);
  header.write('0',156);header.write('ustar\0',257);header.write('00',263);
  const checksum=header.reduce((sum,byte)=>sum+byte,0);
  header.write(checksum.toString(8).padStart(6,'0')+'\0 ',148,8,'ascii');
  archive.push(header,data,Buffer.alloc((512-data.length%512)%512));
}
for(const name of ["assets","source","scripts",".github",".gitignore",".gitattributes","index.html","canvas.css","game.js","simulation.js","ui.js","serve.mjs","verify.mjs","package.json","README.md","COPYING","CREDITS.TXT","THIRD_PARTY_NOTICES.md","asset-provenance.json","build-report.json"])addSource(name);
archive.push(Buffer.alloc(1024));
fs.writeFileSync(path.join(output,'skijump3-source.tar.gz'),gzipSync(Buffer.concat(archive)));

console.log('Built Ski Jump International 3 in dist/');
