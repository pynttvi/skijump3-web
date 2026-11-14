// Dependency-free static server for the exported game; GPL-3.0.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const {values}=parseArgs({options:{host:{type:'string',default:'0.0.0.0'},port:{type:'string',default:'8084'},help:{type:'boolean',default:false}}});
if(values.help){console.log('node serve.mjs [--host 0.0.0.0] [--port 8084]');process.exit(0);}
const root=await fs.realpath(path.dirname(fileURLToPath(import.meta.url)));
await fs.access(path.join(root,'index.html'));
const port=Number(values.port);
if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid port');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  const actual=await fs.realpath(path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':'')));
  const relative=path.relative(root,actual);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)||relative.split(path.sep).some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  const body=await fs.readFile(actual);
  res.writeHead(200,{'Content-Type':types[path.extname(actual).toLowerCase()]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch(error){const status=['ENOENT','EISDIR','ENOTDIR'].includes(error.code)?404:400;res.writeHead(status);res.end(status===404?'Not found':'Bad request');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,values.host,()=>{
 const active=server.address().port;
 console.log(`SJ3 Canvas: http://localhost:${active}`);
 if(values.host==='0.0.0.0')for(const list of Object.values(os.networkInterfaces()))for(const address of list??[])if(address.family==='IPv4'&&!address.internal&&address.address.startsWith('192.168.'))console.log(`LAN: http://${address.address}:${active}`);
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());
