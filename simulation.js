// GPL-3.0. Translated from Ville Könönen's SJ3.PAS hyppy(), SJ3TABLE.PAS,
// and TUULI.PAS at ba1d5035af483a2c575bb38af64de61322d7e2a5.
// Browser fixed-step timing and xorshift RNG are explicit compatibility changes.
export const STEP=1/70;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function round(v){const floor=Math.floor(v),part=v-floor;return part===0.5?(floor%2===0?floor:floor+1):Math.round(v);}
const f=Math.fround;
export function random(state,limit){let x=state.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;state.seed=x>>>0;return limit?state.seed%limit:0;}
export function ground(state,x){x=round(x);return x>0&&x<1300?state.hill.profile[Math.min(x,1023)]:0;}
export function slope(state,x){x=round(x);if(x>state.hill.lip-15&&x<=state.hill.lip)return 0;return [6,7,8,9].reduce((n,d)=>n+ground(state,x+d),0)-[-2,-3,-4,-5].reduce((n,d)=>n+ground(state,x+d),0);}
export function skis(angle){const ranges=[[4,6],[7,9],[10,12],[13,16],[17,19],[20,24],[25,28],[29,33],[34,39],[40,48],[49,64],[65,90]];const i=ranges.findIndex(([a,b])=>angle>=a&&angle<=b);return i<0?71:72+i;}
export function crouch(ski){const i=ski-71;return 101+(i>=2&&i<=4?1:i<=6&&i>=5?2:i>=7&&i<=9?3:i>=10&&i<=12?4:0);}
export function flightFrame(angle){return 106+(angle>=50&&angle<=61?1:angle>=62&&angle<=76?2:angle>=77&&angle<=95?3:angle>=96&&angle<=119?4:angle>=120&&angle<=149?5:angle>=150&&angle<=186?6:angle>=187&&angle<=1000?7:0);}
export function flightSkis(angle){
 const ranges=[[-900,-258,19],[-257,-216,18],[-215,-176,17],[-175,-136,16],[-135,-97,15],[-96,-59,14],[-58,-20,13],[20,58,1],[59,96,2],[97,135,3],[136,175,4],[176,215,5],[216,257,6]];
 return 71+(ranges.find(([a,b])=>angle>=a&&angle<=b)?.[2]??0);
}
function takeoffFrame(state){const p=state.takeoffFrame++;return p>=24&&p<=50?112:p>=21&&p<=23?123:p>=18&&p<=20?122:p>=14&&p<=17?121:p>=10&&p<=13?120:p>=7&&p<=9?119:p>=4&&p<=6?118:117;}
export function landingHeight(angle){if(angle>=0&&angle<=24)return 50;return ({25:48,26:45,27:40,28:36,29:32,30:28,31:24,32:22})[angle]??(angle>=33&&angle<=39?20:angle>=40&&angle<=60?15:25);}
export function jumpRisk(angle){return 1+(({31:1,30:2,29:4,28:7,27:12,26:19,25:29,24:41,23:54,22:70,21:90,20:120,19:200,18:300,17:500,16:700})[angle]??(angle>=0&&angle<=15?950:0));}
function windStep(s){const w=s.wind;if(w.up&&w.angle>w.high)w.up=false;if(!w.up&&w.angle<w.low)w.up=true;if(random(s,50)===0)w.up=!w.up;w.angle=f(w.angle+(w.up?1:-1)*random(s,4)/5);w.value=round(Math.cos(Math.PI*w.angle/180)*w.force);}
export function createJump(hill,seed=1,{calm=false}={}){
 if(hill.profile.length!==1024||!(hill.lip>10&&hill.lip<1024)||!(hill.maxSpeed>0))throw new Error('Invalid hill data');
 const s={hill,seed:(seed>>>0)||1,ticks:0,phase:'inrun',distance:-hill.lip+10,x:10,y:hill.profile[10],px:0,py:0,
  t:0,pl:f(hill.gravity),angle:0,skiAngle:0,skiMotion:0,takeoff:0,takeoffAtLip:null,takeoffFrame:0,body:165,skis:71,
  height:0,deltaH:[0,0,0],flightTicks:0,landing:0,initialFlight:true,style:195,minAngle:200,result:null,
  initialSeed:seed>>>0,outrunTicks:0,calm};
 const a=random(s,180),b=random(s,120);s.wind={low:a-b,high:a+b,angle:random(s,b*2)+a-b,force:calm?0:random(s,50),up:random(s,2)!==0,windy:calm?0:b,value:0};
 return s;
}
function distanceScore(s){const dx=s.distance,dy=s.y-ground(s,s.hill.lip);return round(Math.hypot(dx,dy)*s.hill.scale*0.5)*5;}
export function scoreLanding(s){
 const hp=distanceScore(s),angle=slope(s,s.x),height=round(angle*1.34+s.angle/10);
 let risk=jumpRisk(angle),fall=0,style=s.style;
 if(hp<20/3*s.hill.k)risk=1;
 if(height<63)risk=round(risk*(1+(63-height)*0.075));
 if(!s.landing||height<56)fall=!s.landing?1:2;
 if(s.landing===1){risk*=3;if(height<60)style-=5;if(height<64)style-=5;}
 if(random(s,1000)<risk)fall=3;
 style-=Math.max(0,round((s.hill.k+s.hill.k/20-hp/10)/6))*5;
 if(fall)style-=100;else if(s.landing===2)style-=15+random(s,2)*5;
 const judges=[style];for(let i=1;i<5;i++)judges.push(style-(random(s,4)-1)*5);
 for(let i=0;i<5;i++)judges[i]=clamp(judges[i],0,200);
 const stylePoints=judges.reduce((a,b)=>a+b,0)-Math.min(...judges)-Math.max(...judges);
 const lengthPoints=round((hp/10-s.hill.k*2/3)*(180/s.hill.k)*10);
 return {length:hp/10,points:(stylePoints+lengthPoints)/10,judges:judges.map(v=>v/10),
  stylePoints:stylePoints/10,lengthPoints:lengthPoints/10,fall,risk,landing:s.landing,
  takeoff:s.takeoffAtLip??0,wind:s.wind.value/10,seed:s.initialSeed};
}
function wobble(s){
 switch(s.skiMotion){
 case 1:if(s.skiAngle===0)s.skiAngle=Math.max(-105,-51-(16-s.takeoff)*6);else s.skiAngle-=4;if(s.skiAngle<(s.takeoff-16)*14)s.skiMotion=2;break;
 case 2:if(s.skiAngle<0)s.skiAngle+=2;if(s.skiAngle>0)s.skiAngle=0;break;
 case 3:s.skiAngle-=random(s,50)+30;s.skiMotion=2;break;
 case 4:if(s.skiAngle===0)s.skiAngle=Math.min(130,70+(s.takeoff-16)*6);else s.skiAngle+=3;if(s.skiAngle>(s.takeoff-16)*14)s.skiMotion=5;break;
 case 5:if(s.skiAngle>0)s.skiAngle--;if(s.skiAngle<0)s.skiAngle=0;break;
 case 6:s.skiAngle+=random(s,50)+30;s.skiMotion=5;break;
 }
 if(s.skiAngle===0)s.skiMotion=0;
}
export function assistInput(s){
 if(s.distance<0)return {takeoff:s.distance+s.px*0.01>-(16*s.px*0.01)};
 const body=flightFrame(s.angle),input={};
 if((s.flightTicks+1)%5===0){input.forward=body>107;input.backward=body<107;}
 if(!s.landing&&s.distance>3&&s.height<4)input.parallel=true;
 if(!s.landing&&s.deltaH.reduce((a,b)=>a+b,0)>1&&s.height<landingHeight(slope(s,s.x)))input.telemark=true;
 return input;
}
export function stepJump(s,input={}){
 if(s.phase==='result')return;
 s.ticks++;
 windStep(s);
 if(s.phase==='outrun'){
  s.outrunTicks++;s.x=Math.min(1020,s.x+s.px*0.008);s.y=ground(s,s.x);s.px=Math.max(0,s.px-0.8);
  s.skis=skis(slope(s,s.x));const i=s.skis-71;s.body=(i<=4?127:i<=6?126:i===7?125:124)+(s.landing===2?6:0);
  if(s.result.fall)s.body=134+Math.min(9,Math.floor(s.outrunTicks/5));
  if(s.outrunTicks>=120||s.x>=1019)s.phase='result';
  return;
 }
 s.distance=f(s.distance+f(s.px*0.01));s.x=round(s.distance+s.hill.lip+0.5);
 if(s.distance<0){
  if(s.takeoff>0)s.takeoff++;
  if(input.takeoff&&s.distance>-40&&!s.takeoff)s.takeoff=1;
  s.skis=skis(slope(s,s.x));s.body=crouch(s.skis);
  if(s.ticks<28){s.body=165+Math.floor(s.ticks/7);s.px=s.ticks<14?0:37;}
  if(s.takeoff)s.body=takeoffFrame(s);
  s.y=ground(s,s.x);s.px=f(Math.min(s.hill.maxSpeed,f(s.px*1.016)));
  if(s.takeoff){s.px=f(s.px+0.21);s.py=f(s.py+1.21);s.angle+=12;
   if(s.takeoff>16){if(s.takeoff===17)s.pl=f(s.pl+0.023);s.pl=f(s.pl+0.013);s.py=f(s.py-1);s.angle=158;}}
 }else{
  s.phase='flight';s.flightTicks++;s.minAngle=Math.min(s.angle,s.minAngle);
  if(input.telemark)s.landing=1;if(input.parallel)s.landing=2;
  if(input.backward&&s.angle<=600)s.angle+=round(s.angle/4);
  if(input.forward&&!s.landing&&s.angle>0)s.angle-=round(s.angle/5);
  if(s.angle<50)s.pl=f(s.pl+0.0001-(s.angle-50)/18000);
  const gust=Math.sqrt(Math.sqrt(2*Math.abs(s.wind.value)))/65500;
  s.pl=f(s.pl-(1-s.angle/900)/1875+(s.wind.value>0?gust:-gust));
  s.px=f(s.px-s.angle/900/20+(Math.sqrt(Math.max(0,4*s.wind.value+245))-16)/400);
  s.t=f(s.t+0.01);
  if(random(s,30000)<s.wind.windy+10+s.wind.force){
   if(random(s,2))s.style-=5;
   const rotation=random(s,15)-6;s.angle+=rotation;
   if(rotation>0){s.skiMotion=3;s.pl=f(s.pl-random(s,s.wind.force+50)/15000);}
   if(rotation<0){s.skiMotion=6;s.pl=f(s.pl+random(s,s.wind.force+50)/15000);}
  }
  s.pl=f(Math.max(s.pl,0.105));s.y=f(s.y+f(s.t*s.t*s.pl)-(s.py-8)/100);wobble(s);
  if(s.landing&&s.angle<600){s.angle+=9+(s.landing-1)*5;if(s.pl<1)s.pl=f(s.pl+0.003);}
  if(s.initialFlight){s.initialFlight=false;s.takeoffAtLip=s.takeoff;s.angle=158;
   if(s.takeoff<16)s.skiMotion=1;if(s.takeoff>16)s.skiMotion=4;if(!s.takeoff)s.skiMotion=0;}
  s.body=flightFrame(s.angle);if(s.takeoffFrame<25)s.body=takeoffFrame(s);
  const oldHeight=s.height;s.height=Math.max(0,ground(s,s.x)-round(s.y));s.deltaH[s.flightTicks%3]=oldHeight-s.height;
  s.skis=s.height<6&&s.distance>20?skis(Math.trunc(slope(s,s.x)/(s.height+1))):flightSkis(s.skiAngle);
  if(s.height===0||s.x>=1020||s.ticks>2400){s.y=ground(s,s.x);s.result=scoreLanding(s);s.phase='outrun';}
 }
 if(!Number.isFinite(s.x+s.y+s.px+s.pl))throw new Error('Non-finite jump state');
}
