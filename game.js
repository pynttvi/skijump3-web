// GPL-3.0, browser presentation around the translated SJ3 simulation.
import {loadGraphics,applyGraphics,drawGraphic} from './graphics.js';
import {STEP,createJump,stepJump,assistInput,clamp,ground,round} from './simulation.js';
const scene=await fetch('./assets/scene.json').then(r=>{if(!r.ok)throw new Error('Missing hill data');return r.json();});
export const metadata={title:'SKI JUMP INTERNATIONAL 3',description:'Twenty original hills. One perfectly timed takeoff.',
 edition:'PASCAL → CANVAS · SOURCE PORT',width:320,height:200,
 scenes:scene.hills.map(h=>({id:h.id,name:`${h.name} · K${h.k}`})),
 controls:[['Take off','↑ / Space · just before the lip'],['Lean forward / back','→ / ← · short taps'],['Telemark landing','T · prepare before touchdown'],['Two-foot landing','R · safer, fewer style points'],['Practice assist','Optional computer-jumper timing'],['Competition','Two jumps · best total wins']],
 hudLabels:{health:'SPEED',ammo:'DISTANCE',enemies:'WIND',weapon:'FLIGHT'}};
function loadImage(file){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Cannot load ${file}`));image.src='./assets/'+file;});}
export function createGame(canvas){
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const $=id=>document.getElementById(id),keys=new Set();let pending={},heldTicks=0;
 let graphicsScale=1,currentInfo=null;
 let hill=null,state=null,front=null,back=null,atlas=null,loading=false,error=null,token=0,paused=false,accumulator=0,overview=false;
 let results=[],frames=[],lastReplay=[],replayIndex=-1,recorded=false,assistedUsed=false,roundNumber=1,seed=1000;
 let audio=null,gain=null,oscillator=null,sound=false;
 const detail=document.querySelector('.detail');
 detail.textContent='Twenty source-verified hills. Time your takeoff, control your flight posture, and prepare your landing.';
 document.querySelector('.prototype p').textContent='Original GPL-3.0 hill graphics, jumper animations and Pascal jump/scoring formulas. Browser timing, RNG and input differ from DOS. Cups and original record/replay files are not ported.';
 $('overlay-title').textContent='The hill is yours.';
 $('overlay-note').textContent='Press Up just before the lip. Tap Right to lean into flight; use T for a telemark or R for a safer two-foot landing. Optional practice assist can show the timing.';
 $('start').firstChild.textContent='Start jumping ';
 $('map').textContent='Hill overview';$('health').max=200;
 $('game-credits').textContent='SJ3 © Ville Könönen · GPL-3.0 · Native Canvas';
 const extra=document.createElement('section');extra.className='panel';
 const heading=document.createElement('h2');heading.textContent='On the start bar.';
 const rounds=document.createElement('p');rounds.className='detail';
 const assistLabel=document.createElement('label'),assist=document.createElement('input');assist.type='checkbox';assistLabel.append(assist,document.createTextNode(' Practice assist'));
 const calmLabel=document.createElement('label'),calm=document.createElement('input');calm.type='checkbox';calmLabel.append(calm,document.createTextNode(' Calm wind on next jump'));
 const next=document.createElement('button');next.textContent='Next jump';next.disabled=true;
 const replay=document.createElement('button');replay.textContent='Replay jump';replay.disabled=true;
 const score=document.createElement('p');score.className='detail';score.setAttribute('aria-live','polite');
 extra.append(heading,rounds,assistLabel,calmLabel,next,replay,score);document.querySelector('aside').prepend(extra);
 const touch=document.createElement('div');touch.className='toolbar';touch.setAttribute('aria-label','Jump controls');
 for(const [label,key] of [['Take off ↑','ArrowUp'],['Lean ←','ArrowLeft'],['Lean →','ArrowRight'],['Telemark · T','KeyT'],['Two feet · R','KeyR']]){
  const button=document.createElement('button');button.textContent=label;button.style.touchAction='none';
  button.onpointerdown=e=>{e.preventDefault();keys.add(key);pending[key]=true;button.setPointerCapture(e.pointerId);};
  button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>keys.delete(key);touch.append(button);
 }
 $('play-area').append(touch);
 const graphicsButton=$('graphics');
 function installGraphics(graphics){
  ({front,back,atlas}=graphics);graphicsScale=graphics.scale;applyGraphics(canvas,ctx,graphics);
  graphicsButton.textContent='Upscaled graphics: '+(graphicsScale===4?'on':'off');
  graphicsButton.setAttribute('aria-pressed',String(graphicsScale===4));graphicsButton.title='';
 }
 graphicsButton.onclick=async()=>{
  if(loading)return;
  if(!hill){
   graphicsScale=graphicsScale===1?4:1;
   graphicsButton.textContent='Upscaled graphics: '+(graphicsScale===4?'on':'off');
   graphicsButton.setAttribute('aria-pressed',String(graphicsScale===4));return;
  }
  canvas.focus();
  const request=++token,scale=graphicsScale===1?4:1;
  graphicsButton.disabled=true;graphicsButton.textContent='Loading graphics…';
  try{
   const graphics=await loadGraphics(currentInfo,scale,loadImage);
   if(request===token)installGraphics(graphics);
  }catch(reason){if(request===token){graphicsButton.textContent='Graphics unavailable — retry';graphicsButton.title=reason.message;}}
  finally{if(request===token)graphicsButton.disabled=false;}
 };

 function clearInput(){keys.clear();pending={};heldTicks=0;}
 window.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target?.tagName))return;
  if(['ArrowUp','ArrowLeft','ArrowRight','Space','KeyT','KeyR'].includes(e.code)){
   e.preventDefault();keys.add(e.code);if(!e.repeat)pending[e.code]=true;
  }
 });
 window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
 function sessionText(){rounds.textContent=`Jump ${roundNumber} / 2 · Total ${results.reduce((sum,r)=>sum+r.points,0).toFixed(1)} pts`;}
 function begin(){
  state=createJump(hill,++seed,{calm:calm.checked});accumulator=0;paused=false;recorded=false;assistedUsed=false;frames=[];replayIndex=-1;clearInput();
  next.disabled=true;replay.disabled=true;score.textContent='';sessionText();canvas.focus();
 }
 async function load(id){
  const request=++token;graphicsButton.disabled=true;loading=true;error=null;state=null;results=[];roundNumber=1;next.disabled=true;replay.disabled=true;
  const info=scene.hills.find(h=>h.id===id)??scene.hills[0];
  try{
   const [response,graphics]=await Promise.all([fetch(`./assets/hills/${info.id}.json`),loadGraphics(info,graphicsScale,loadImage)]);
   if(!response.ok)throw new Error('Missing hill profile');const data=await response.json();
   if(request!==token)return;
   hill=data;currentInfo=info;installGraphics(graphics);graphicsButton.disabled=false;loading=false;begin();
  }catch(reason){if(request===token){loading=false;error=reason.message;$('status').textContent=error;}}
 }
 next.onclick=()=>{if(!state?.result)return;if(results.length>=2){results=[];roundNumber=1;}else roundNumber=2;begin();};
 replay.onclick=()=>{if(!lastReplay.length)return;replayIndex=0;accumulator=0;clearInput();};
 function saveResult(){
  if(recorded||!state?.result)return;recorded=true;results.push({...state.result,assisted:assistedUsed,calm:state.calm});sessionText();
  const r=state.result,kind=r.fall?'Fall':r.landing===1?'Telemark':'Two feet';
  score.textContent=`${r.length.toFixed(1)} m · ${r.points.toFixed(1)} pts · ${kind}. Judges: ${r.judges.map(n=>n.toFixed(1)).join(' / ')}. Takeoff: ${r.takeoff===16?'perfect':r.takeoff===0?'missed':r.takeoff>16?'early':'late'}.`;
  next.textContent=results.length>=2?'New competition':'Second jump';next.disabled=false;
  try{const key=`sj3-canvas-best-${hill.id}-${assistedUsed?'assisted':'manual'}-${state.calm?'calm':'wind'}`,old=Number(localStorage.getItem(key)||0);if(r.points>old){localStorage.setItem(key,String(r.points));score.textContent+=' New local best!';}}catch{}
 }
 function snapshot(){return {x:state.x,y:state.y,body:state.body,skis:state.skis,phase:state.phase,height:state.height,distance:state.distance,angle:state.angle,px:state.px,wind:state.wind.value,result:state.result};}
 function sprite(frame,x,y){const s=scene.animations[frame];if(!s)return;drawGraphic(ctx,atlas,graphicsScale,s.x,s.y,s.width,s.height,round(x)-s.cx,round(y)-s.cy,s.width,s.height);}
 function text(label,x,y,color='#ffffff',size=7){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.fillText(label,x,y);}
 function draw(){
  ctx.fillStyle='#17182a';ctx.fillRect(0,0,320,200);ctx.textAlign='left';
  if(!state){text(error?`Load failed: ${error}`:loading?'Loading original hill…':'Choose a hill, then start jumping.',12,100);return;}
  const view=replayIndex>=0?lastReplay[Math.min(Math.floor(replayIndex),lastReplay.length-1)]:snapshot();
  const camera={x:clamp(round(view.x)-135,0,704),y:clamp(round(view.y)-100,0,312)};
  if(overview){
   // Full foreground plus the background at half-scroll is a diagnostic overview.
   drawGraphic(ctx,back,graphicsScale,0,0,1024,400,0,0,320,200);drawGraphic(ctx,front,graphicsScale,0,0,1024,512,0,0,320,200);
   ctx.fillStyle='#ffc775';ctx.fillRect(view.x/1024*320-1,view.y/512*200-1,3,3);
   text(`${hill.name} · K${hill.k} · overview`,8,14,'#ffc775');return;
  }
  drawGraphic(ctx,back,graphicsScale,Math.floor(camera.x/2),Math.floor(camera.y/2),320,200,0,0,320,200);
  drawGraphic(ctx,front,graphicsScale,camera.x,camera.y,320,200,0,0,320,200);
  const x=view.x-camera.x,y=view.y-camera.y;
  sprite(view.body,x,y-2);sprite(view.skis,x,y-1);
  ctx.fillStyle='#101020b8';ctx.fillRect(0,0,320,22);
  text(`${hill.name} K${hill.k}`,5,8,'#ffcf76');text(`Jump ${roundNumber}/2 ${assist.checked?'· ASSIST':''}`,5,17,'#c4c9d4');
  text(`${(view.wind/10).toFixed(1)} m/s`,247,8,'#c0d9ef');
  if(replayIndex>=0)text('REPLAY',265,17,'#ffcf76');
  else if(view.phase==='inrun'){
   const remaining=-view.distance;
   const ideal=16*view.px*0.01;
   text(remaining<40?'TAKEOFF WINDOW':'BUILDING SPEED',111,17,Math.abs(remaining-ideal)<4?'#8dffa8':'#e4dfee');
   const lip=hill.lip-camera.x;
   if(lip>=0&&lip<320){ctx.strokeStyle='#ffc775';ctx.beginPath();ctx.moveTo(lip,ground(state,hill.lip)-camera.y-16);ctx.lineTo(lip,ground(state,hill.lip)-camera.y);ctx.stroke();}
  }else if(view.phase==='flight'){
   text(view.height<30&&!state.landing?'PREPARE LANDING':view.angle<50?'OVER-ROTATED':view.angle<=76?'GOOD FLIGHT POSTURE':'LEAN FORWARD →',105,17,view.angle>=50&&view.angle<=76?'#8dffa8':'#ffcf76');
  }
  if(view.result){
   const r=view.result;ctx.fillStyle='#0e1423d9';ctx.fillRect(62,32,196,38);ctx.textAlign='center';
   text(`${r.length.toFixed(1)} m · ${r.points.toFixed(1)} pts`,160,47,r.fall?'#ffb09e':'#ffcf76',11);
   text(r.fall?'FALL':r.landing===1?'TELEMARK':'TWO-FOOT LANDING',160,61,'#d8e2f0');ctx.textAlign='left';
  }
 }
 return {
  start:load,restart:load,pause(value){paused=value;clearInput();if(gain)gain.gain.setTargetAtTime(0,audio.currentTime,0.04);},showMap(value){overview=value;},
  async setSound(enabled){
   if(!enabled){sound=false;if(gain)gain.gain.setTargetAtTime(0,audio.currentTime,0.04);return false;}
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Web Audio is unavailable');
   if(!audio){audio=new Audio();gain=audio.createGain();gain.gain.value=0;gain.connect(audio.destination);oscillator=audio.createOscillator();oscillator.type='triangle';oscillator.frequency.value=80;oscillator.connect(gain);oscillator.start();}
   await audio.resume();if(audio.state!=='running')throw new Error('Audio remains suspended');sound=true;return true;
  },
  update(seconds){
   if(!state||paused)return;accumulator+=Math.min(seconds,0.1);
   while(accumulator>=STEP){
    accumulator-=STEP;
    if(replayIndex>=0){replayIndex=Math.min(lastReplay.length-1,replayIndex+1);continue;}
    const repeat=heldTicks++%8===0;
    if(state.phase==='result'){accumulator=0;break;}
    assistedUsed ||= assist.checked;
    const input={takeoff:pending.ArrowUp||pending.Space,
     forward:pending.ArrowRight||(repeat&&keys.has('ArrowRight')),backward:pending.ArrowLeft||(repeat&&keys.has('ArrowLeft')),
     telemark:pending.KeyT,parallel:pending.KeyR};pending={};
    stepJump(state,assist.checked?assistInput(state):input);frames.push(snapshot());
    if(state.result)saveResult();
    if(state.phase==='result'){lastReplay=frames.slice();replay.disabled=false;break;}
   }
   if(sound&&audio?.state==='running'){oscillator.frequency.setTargetAtTime(60+state.px*0.5,audio.currentTime,0.08);gain.gain.setTargetAtTime(state.phase==='flight'?0.01:state.phase==='inrun'?0.015:0,audio.currentTime,0.08);}
  },render:draw,
  getHUD(){
   if(!state){if(error)$('status').textContent='Load failed';return {health:0,ammo:'—',enemies:'—',weapon:loading?'Loading':'Ready'};}
   if(!paused)$('status').textContent=replayIndex>=0?'Replay':state.phase==='inrun'?'Inrun':state.phase==='flight'?'In flight':state.result?.fall?'Fall':'Landed';
   return {health:round(state.px),ammo:state.result?`${state.result.length.toFixed(1)} m`:state.distance>0?`${(Math.hypot(state.distance,state.y-hill.lipY)*hill.scale/2).toFixed(1)} m`:'—',enemies:`${(state.wind.value/10).toFixed(1)}`,weapon:state.phase==='inrun'?'Takeoff ↑':state.landing===1?'Telemark':state.landing===2?'Two feet':state.phase==='flight'?'Lean →':'Ready'};
  },
 };
}
