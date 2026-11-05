'use strict';
/* VILARIS mobile — Soft Pixel Fantasy. Simulação (step) separada da renderização (draw). */
const $=s=>document.querySelector(s),SAVE='vilaris_m1',OFFCAP=8*3600,LIFE=300,W=116,H=140,CS=4,GC=29,GR=35;
const SUF=['','mil','mi','bi','tri','Qa','Qi'];
const fmt=n=>{n=Math.abs(n);if(n<1000)return n.toLocaleString('pt-BR',{maximumFractionDigits:n<10?1:0});const e=Math.min(Math.floor(Math.log10(n)/3),6);return (n/10**(3*e)).toLocaleString('pt-BR',{maximumFractionDigits:2})+' '+SUF[e]};
const ERAS=['Era I — Vilarejo Medieval','Era II — O Reino'];
// nome, custo, renda/s, tamanho (células de 4px), era mínima, descrição
const BT=[{n:'Casa',c:10,i:.1,s:3,e:0,d:'+4 moradias'},{n:'Fazenda',c:50,i:.5,s:3,e:0,d:'+4 comida/s'},{n:'Mercado',c:200,i:2,s:3,e:0,d:'Comércio'},
 {n:'Oficina',c:1000,i:10,s:3,e:0,d:'Polui'},{n:'Castelo',c:1e4,i:100,s:4,e:1,d:'+segurança'},{n:'Banco',c:1e5,i:1000,s:3,e:1,d:'+desigualdade'}];
const CAT=['Economia','População','Sociedade','Tecnologia','Ambiente','Especial'],RAR=['Comum','Rara','Especial'];
// nome, categoria, raridade, efeito, consequência, modificadores (x = multiplicador, demais = soma)
const CARDS=[
 ['Prosperidade Comercial',0,0,'Renda de todas as construções +25%','Aumenta a desigualdade social',{xInc:1.25,ineq:12}],
 ['Arquitetura Monumental',0,1,'Renda dos edifícios +40%','Próximas construções custam +15%',{xInc:1.4,xCost:1.15}],
 ['Automação Medieval',0,1,'Renda de oficinas e mercados +100%','Felicidade −10',{xMW:2,hap:-10}],
 ['Impostos Justos',0,0,'Renda +10% e estabilidade +5','Construções custam +5%',{xInc:1.1,stab:5,xCost:1.05}],
 ['Guilda dos Mercadores',0,0,'Mercados e oficinas rendem +50%','Desigualdade aumenta',{xMW:1.5,ineq:8}],
 ['Cofres Bem Guardados',0,0,'Construções 15% mais baratas','Segurança −5',{xCost:.85,sec:-5}],
 ['Expansão Acelerada',1,0,'Natalidade +50%','Comida +20% de consumo e moradias −10%',{xNatal:1.5,xEat:1.2,xCap:.9}],
 ['Celeiros Comunitários',1,0,'Consumo de comida −20%','Fazendas rendem −15%',{xEat:.8,xFarm:.85}],
 ['Casas de Pedra',1,0,'Moradias +40%','Construções 10% mais caras',{xCap:1.4,xCost:1.1}],
 ['Parteiras Sábias',1,0,'Natalidade +30% e felicidade +3','Consumo de comida +10%',{xNatal:1.3,hap:3,xEat:1.1}],
 ['Festival da Colheita',2,0,'Felicidade +10','Renda −5%',{hap:10,xInc:.95}],
 ['Conselho dos Anciãos',2,0,'Estabilidade +10','Expansão territorial 20% mais cara',{stab:10,xExp:1.2}],
 ['Guarda Real',2,0,'Segurança +15','Renda −5%',{sec:15,xInc:.95}],
 ['Pão e Circo',2,1,'Felicidade +15','Estabilidade −5 e consumo de comida +10%',{hap:15,stab:-5,xEat:1.1}],
 ['Moinhos de Vento',3,0,'Produção de comida +40%','Poluição +10%',{xFood:1.4,xPoll:1.1}],
 ['Escrita e Arquivos',3,0,'Evolução 30% mais rápida','Desigualdade +4',{xPE:1.3,ineq:4}],
 ['Engenharia Civil',3,1,'Construções 20% mais baratas','Poluição +30%',{xCost:.8,xPoll:1.3}],
 ['Pacto da Natureza',4,0,'Ambiente +10 e poluição −40%','Expansão territorial 30% mais cara',{env:10,xPoll:.6,xExp:1.3}],
 ['Florestas Sagradas',4,0,'Ambiente +6 e poluição −20%','Renda −5%',{env:6,xPoll:.8,xInc:.95}],
 ['Contrato Faustiano',5,2,'Renda ×2','Poluição ×2, ambiente −10, desigualdade +25',{xInc:2,xPoll:2,env:-10,ineq:25}],
 ['Era de Ouro',5,2,'Renda +60% e natalidade +40%','Felicidade −12: o luxo cobra seu preço',{xInc:1.6,xNatal:1.4,hap:-12}]];
const BN=['FOME','FELICIDADE','ESTABILIDADE','SEGURANÇA','AMBIENTE'];
const EX=['Fome: capacidade de alimentar a população. Fazendas produzem comida; cada aldeão consome.','Felicidade: satisfação dos aldeões. Cai com fome, superlotação e poluição.','Estabilidade: saúde política e social. Depende da felicidade, da segurança e da desigualdade.','Segurança: proteção contra ameaças. Castelos e cartas de sociedade a elevam.','Ambiente: sustentabilidade do território. Oficinas poluem; cartas de ambiente ajudam.'];
const CRIT=['Fome crítica: a população está consumindo mais comida do que a vila produz.','Felicidade crítica: os aldeões estão insatisfeitos e a estabilidade vai cair.','Estabilidade crítica: uma revolta pode derrubar o reino.','Segurança crítica: a vila está desprotegida.','Ambiente crítico: a poluição ameaça a vida no território.'];
const FAIL={fome:['Extinção por fome','Os aldeões consumiram mais do que a vila produzia, até não restar ninguém.'],revolta:['Colapso político','A estabilidade ficou crítica por tempo demais e o povo derrubou o reino.'],ambiental:['Colapso ambiental','A poluição tornou o território incapaz de sustentar a vida.']};

const def=()=>({money:10,pop:6,pp:[2,1,1,0,2],bl:[],cards:[],ch:0,pe:0,t:0,fome:75,hap:60,stab:60,sec:30,poll:0,terr:0,era:0,pick:null,over:null,lowT:0,envT:0,bA:0,dA:0,br:0,dr:0,fx:false,last:Date.now()});
let S=def(),noSave=false,V=[],MOD,CNT=[0,0,0,0,0,0],WEL='start',tmsg='',tmT=0,shake=0;
try{const r=JSON.parse(localStorage.getItem(SAVE));if(r)S=Object.assign(def(),r)}catch(e){}
const msg=(t,s)=>{tmsg=t;tmT=Date.now()+s*1000};
function recalc(){MOD={xInc:1,xCost:1,xEat:1,xFood:1,xNatal:1,xCap:1,xPoll:1,xExp:1,xMW:1,xFarm:1,xPE:1,hap:0,stab:0,sec:0,env:0,ineq:0};
  S.cards.forEach(i=>{const m=CARDS[i][5];for(const k in m)k[0]=='x'?MOD[k]*=m[k]:MOD[k]+=m[k]})}
const recount=()=>CNT=BT.map((b,t)=>S.bl.filter(x=>x[0]==t).length);

/* ---------- simulação ---------- */
const tier=n=>n>=50?5:n>=25?3:n>=10?2:1;
const cost=t=>BT[t].c*1.15**CNT[t]*MOD.xCost;
const amb=()=>Math.max(0,Math.min(100,100-S.poll+MOD.env));
function econ(){const he=.6+S.hap/250;let inc=S.pop*.1;
  BT.forEach((b,t)=>{let v=CNT[t]*b.i*tier(CNT[t]);if(t==1)v*=MOD.xFarm;if(t==2||t==3)v*=MOD.xMW;inc+=v});
  return {inc:inc*MOD.xInc*he,food:CNT[1]*4*tier(CNT[1])*MOD.xFood,eat:S.pop*.5*MOD.xEat,cap:Math.floor((4+CNT[0]*4*tier(CNT[0]))*MOD.xCap)}}
function birth(){const w=[1+CNT[1]*2,1+CNT[2]*2,1+CNT[3]*2,.3+CNT[4]*3,1.5];let r=Math.random()*w.reduce((a,b)=>a+b),i=0;while((r-=w[i])>0&&i<4)i++;S.pp[i]++;S.pop++;S.pe+=.5}
function death(){let r=Math.random()*S.pop,i=0;while((r-=S.pp[i])>=0&&i<4)i++;if(S.pp[i]>0){S.pp[i]--;S.pop--}}
const ease=(k,t,dt)=>S[k]+=(Math.max(0,Math.min(100,t))-S[k])*Math.min(1,dt*.1);
const need=()=>60*4.5**S.ch;
function step(dt){if(S.over||S.pick)return;const e=econ();S.t+=dt;S.money+=e.inc*dt;
  const ratio=e.eat>0?e.food/e.eat:2,ineq=MOD.ineq+CNT[5]*3;
  S.fome+=(Math.min(100,ratio*75)-S.fome)*Math.min(1,dt*.15);
  S.br=ratio>=1&&S.hap>25&&S.pop<e.cap?Math.max(.05,S.pop*.03)*MOD.xNatal:0;
  S.dr=S.pop/LIFE+S.pop*.05*Math.max(0,.8-ratio)+(S.pop>e.cap?.3:0);
  S.bA+=S.br*dt;S.dA+=S.dr*dt;
  while(S.bA>=1){S.bA--;if(S.pop<e.cap)birth()}
  while(S.dA>=1&&S.pop>0){S.dA--;death()}
  if(S.pop<1){S.over=['fome'];return}
  ease('hap',58+MOD.hap+(ratio<1?-(1-ratio)*40:5)+(S.pop>=e.cap?-8:0)-ineq*.15-Math.max(0,(S.poll-40)/3),dt);
  ease('sec',20+Math.min(60,CNT[4]*8)+MOD.sec,dt);
  ease('stab',40+S.hap*.35+(S.sec-30)*.25+MOD.stab+CNT[4]*2-ineq*.3,dt);
  S.poll=Math.max(0,Math.min(100,S.poll+(CNT[3]*.03*MOD.xPoll+S.pop*.00012*MOD.xPoll-.02)*dt));
  S.lowT=S.stab<15?S.lowT+dt:Math.max(0,S.lowT-dt);if(S.lowT>40)S.over=['revolta'];
  S.envT=amb()<5?S.envT+dt:Math.max(0,S.envT-dt);if(S.envT>40)S.over=['ambiental'];
  S.pe+=(e.inc*.25+.2)*MOD.xPE*dt;
  if(S.pe>=need()){S.pe-=need();S.pick=gen()}}
function advance(sec){const st=Math.max(.1,sec/3000);while(sec>0&&!S.over&&!S.pick){const d=Math.min(st,sec);step(d);sec-=d}}
function gen(){const f=S.fome,h=S.hap,st=S.stab,pl=S.poll,cap=econ().cap,c=S.cards;
  const w=CARDS.map((k,i)=>{const rar=k[2],n=c.filter(x=>x==i).length;if(n&&rar>0||n>=2)return 0;let v=[10,4,2][rar];
    if(f<50){if(i==7||i==14)v*=4;if(i==6||i==9||i==13)v*=.3}
    if(h<50&&(i==10||i==13))v*=3;if(h<40&&(i==2||i==20))v*=.4;
    if(st<50&&(i==11||i==3))v*=3;if(S.sec<35&&i==12)v*=3;
    if(pl>30&&(i==17||i==18))v*=4;if(pl>40&&(i==14||i==16||i==19))v*=.3;
    if(S.pop>=cap-1&&i==8)v*=4;if(S.era&&rar)v*=1.5;return v});
  const out=[],cats=new Set;
  while(out.length<3){let ww=w.map((v,i)=>out.includes(i)||cats.has(CARDS[i][1])?0:v),tot=ww.reduce((a,b)=>a+b,0);
    if(!tot){ww=w.map((v,i)=>out.includes(i)?0:v);tot=ww.reduce((a,b)=>a+b,0);if(!tot)break}
    let r=Math.random()*tot,i=0;while((r-=ww[i])>0&&i<ww.length-1)i++;out.push(i);cats.add(CARDS[i][1])}
  return out}
function choose(i){if(!S.pick||!S.pick.includes(i))return;S.cards.push(i);S.ch++;S.pick=null;recalc();
  if(S.ch>=3&&!S.era){S.era=1;msg('Nova era: O Reino! Castelos e bancos desbloqueados.',8)}}

/* ---------- terreno e posicionamento ---------- */
const TB=[[6,10,23,26],[3,6,25,28],[1,3,27,29],[0,0,28,29]],TC=[120,1500,20000];
const blk=new Uint8Array(GC*GR),occ=new Uint8Array(GC*GR),DEC=[];
const mark=(a,x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<GC&&j<GR)a[j*GC+i]=1};
(function(){let s=4242;const r=()=>(s=s*16807%2147483647)/2147483647,free=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=GC||j>=GR||blk[j*GC+i])return false;return true};
  mark(blk,14,0,2,31);mark(blk,0,17,29,2);mark(blk,0,30,29,3);mark(blk,3,3,6,4);DEC.push({k:'p',x:3,y:3});
  for(let i=0,n=0;i<400&&n<28;i++){const x=r()*27|0,y=r()*29|0;if(x>=7&&x<=22&&y>=11&&y<=25&&r()>.12)continue;if(free(x,y,2,2)){DEC.push({k:'t',x,y});mark(blk,x,y,2,2);n++}}
  for(let i=0;i<40;i++){const x=r()*28|0,y=r()*30|0;if(free(x,y,1,1))DEC.push({k:'b',x,y})}
  for(let i=0;i<8;i++){const x=r()*28|0,y=r()*30|0;if(free(x,y,1,1)){DEC.push({k:'r',x,y});mark(blk,x,y,1,1)}}
  for(let i=0;i<4;i++){const x=r()*24|0,y=r()*29|0;if(free(x,y,4,1)){DEC.push({k:'f',x,y});mark(blk,x,y,4,1)}}})();
function findSpot(t){const s=BT[t].s,[x0,y0,x1,y1]=TB[S.terr];let best=null,bd=1e9;
  for(let cy=y0;cy<=y1-s+1;cy++)for(let cx=x0;cx<=x1-s+1;cx++){let ok=true;
    for(let j=0;j<s&&ok;j++)for(let k=0;k<s;k++)if(blk[(cy+j)*GC+cx+k]||occ[(cy+j)*GC+cx+k]){ok=false;break}
    if(!ok)continue;const d=Math.hypot(cx+s/2-15,cy+s/2-18)*(.7+Math.random()*.6);if(d<bd){bd=d;best=[cx,cy]}}
  return best}
const fall=[],FS=new Set,parts=[],scars=[];
function spawn(t){const p=findSpot(t);if(!p)return false;const b=[t,p[0],p[1]];S.bl.push(b);mark(occ,p[0],p[1],BT[t].s,BT[t].s);recount();
  fall.push({b,a:0,d:S.fx?.4:t==4?1.1:.8});FS.add(b);return true}
function buy(t){if(BT[t].e>S.era||S.pick||S.over)return;const c=cost(t);if(S.money<c)return;
  if(!spawn(t)){msg('Sem espaço livre: expanda o território.',4);return}S.money-=c;S.pe+=3+t*2}
const tcost=()=>TC[S.terr]*MOD.xExp;
function expand(){if(S.terr>=3||S.pick||S.over)return;const c=tcost();if(S.money<c)return;S.money-=c;S.terr++;msg('Território expandido!',4)}
function impact(b){const s=BT[b[0]].s*CS,x=b[1]*CS+s/2,y=b[2]*CS+s,t=b[0],n=S.fx?3:t==4?26:t==5?16:10;
  const col=[['#d8c8a0','#8a5a30'],['#d8c8a0','#58b848'],['#d8c8a0','#d44a4a'],['#b0b0b8','#ffb040'],['#c8c8d8','#a0a0b0'],['#ffe060','#fff8c0']][t];
  for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*(t==4?60:36),vy:-Math.random()*(t==4?40:24),l:.6,c:col[i%2]});
  scars.push({x:b[1]*CS-1,y:b[2]*CS+s-3,w:s+2,l:20});if(!S.fx)shake=t==4?5:t==3?2.5:1.5}

/* ---------- pixel art ---------- */
const cv=$('#map');cv.width=W*2;cv.height=H*2;let g=cv.getContext('2d');g.scale(2,2);
const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
const rr=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x+1,y,w-2,h);g.fillRect(x,y+1,w,h-2)};
const sh=(x,y,w)=>{g.fillStyle='rgba(20,30,10,.25)';g.fillRect(x+1,y,w-2,2);g.fillRect(x,y+1,w,1)};
const WALL=['#d49a58','#c8c8d4'],ROOF=['#d0503e','#5a6ec0'];
function sprite(t,x,y,E,tm,nt){const wl=WALL[E],rf=ROOF[E],win=nt?'#fff0a0':'#90c0f0';
  if(t==0){sh(x,y+11,12);rr(wl,x,y+5,12,7);rr(rf,x-1,y+1,14,6);R('rgba(255,255,255,.3)',x+1,y+2,11,1);rr('#5a3418',x+5,y+8,3,4);R(win,x+1,y+7,3,2);R(win,x+9,y+7,2,2)}
  else if(t==1){sh(x,y+11,12);rr('#8a5a30',x,y+2,12,10);for(let k=0;k<4;k++){R('#5cba48',x+1,y+4+k*2,10,1);R('#a8e468',x+1+((tm/400+k)%2|0),y+3+k*2,1,1)}for(let k=0;k<6;k++)R('#d8b070',x+k*2,y+1,1,3)}
  else if(t==2){sh(x,y+11,12);for(let k=0;k<6;k++)R(k%2?'#f4ecdc':'#d44a4a',x+k*2,y+1,2,4);R('#7a4a28',x,y+5,1,7);R('#7a4a28',x+11,y+5,1,7);rr('#c08044',x+1,y+8,10,3);R('#f4d060',x+3,y+7,1,1);R('#e05050',x+6,y+7,2,1)}
  else if(t==3){sh(x,y+11,12);rr('#b86a50',x,y+5,12,7);rr('#44444e',x-1,y+2,14,4);R('#585868',x+8,y-2,3,5);R(nt?'#fff0a0':'#ffb040',x+2,y+8,3,3);
    for(let k=0;k<3;k++)rr('rgba(235,235,235,.6)',x+8+Math.round(Math.sin(tm/400+k)),y-4-((tm/180+k*4)%11|0),3,3)}
  else if(t==4){sh(x,y+15,16);rr('#b8b8c8',x+2,y+6,12,10);rr('#b8b8c8',x,y+3,5,13);rr('#b8b8c8',x+11,y+3,5,13);rr('#4a64c0',x-1,y,7,4);rr('#4a64c0',x+10,y,7,4);
    for(let k=0;k<3;k++)R('#b8b8c8',x+5+k*3,y+5,2,2);rr('#3a2a20',x+6,y+11,4,5);R('#2a2a3a',x+2,y+7,1,2);R('#2a2a3a',x+13,y+7,1,2);R('#7a4a28',x+2,y-4,1,5);R('#e04848',x+3,y-4+((tm/300|0)%2),4,2)}
  else{sh(x,y+11,12);rr('#e0d8c0',x,y+5,12,7);rr('#8a8a98',x-1,y+2,14,4);for(let k=0;k<3;k++)R('#fff',x+1+k*4,y+6,2,5);R('#f4d060',x+5,y+8,2,2)}}
const SK=['#f8d0a8','#e0a878','#b07848'],HR=['#3a2418','#7a4a22','#d8b868','#a0a0a8'],PF=[['#5aa84a','#e8c860'],['#6a4ab8','#4a7ad8'],['#e0903a','#f0b030'],['#7e7e90','#c8c8d8'],['#c8a878','#a86a3a']];
const rnd=a=>a[Math.random()*a.length|0],TY=[1,2,3,4,0];
function target(v,nt){const L=S.bl.filter(x=>x[0]==(nt?0:TY[v.p])),b=L.length?L[Math.random()*L.length|0]:null;
  if(b){const s=BT[b[0]].s;v.tx=b[1]*CS+Math.random()*s*CS;v.ty=Math.min(116,(b[2]+s)*CS+1+Math.random()*3)}else{v.tx=46+Math.random()*28;v.ty=80+Math.random()*10}}
function mk(p){const v={p,x:52+Math.random()*16,y:80,dir:0,st:0,tm:Math.random()*3,s:rnd(SK),h:rnd(HR),v:Math.random()*2|0};target(v,false);return v}
function syncV(){const n=Math.min(S.pop,40),tot=Math.max(1,S.pop),q=S.pp.map(c=>c/tot*n),f=q.map(Math.floor);let rem=n-f.reduce((a,b)=>a+b,0);
  q.map((x,i)=>[x-f[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(o=>f[o[1]]++);
  const cnt=f.map(()=>0);V=V.filter(v=>cnt[v.p]<f[v.p]&&++cnt[v.p]);f.forEach((c,p)=>{while(cnt[p]<c){V.push(mk(p));cnt[p]++}})}
const night=()=>Math.sin(S.t/120*6.283)<-.35;
function vdraw(v,t){const x=v.x|0,y=v.y|0,f=(t/115|0)%2,P=PF[v.p],d=v.dir,wk=v.st==1,phase=Math.sin(t/90+v.tm)*1;
  if(v.st==2){rr(P[0],x,y+5,6,3);rr(v.s,x+5,y+4,3,3);R(v.h,x+5,y+4,3,1);if(f)R('#fff',x+6,y+1,1,1);return}
  sh(x+1,y+7,6);R('#4a3020',x+2+(wk&&f?1:0),y+6,2,2-(v.st==0&&f?1:0));R('#4a3020',x+4-(wk&&f?1:0),y+6,2,2-(v.st==0&&!f?1:0));
  rr(P[0],x+1,y+3,6,3);if(v.v)R('rgba(255,255,255,.3)',x+2,y+3,2,1);R(v.s,x,y+4-(wk&&f?1:0),1,2);R(v.s,x+7,y+4,1,2);rr(v.s,x+1,y,6,3);
  if(d==1)rr(v.h,x+1,y,6,3);else{R(v.h,x+2,y,4,1);R(v.h,x+1,y+1,1,1);R(v.h,x+6,y+1,1,1);if(d!=3)R('#222',x+2,y+2,1,1);if(d!=2)R('#222',x+5,y+2,1,1)}
  const o=wk&&f?1:0;
  if(v.p==0){R(P[1],x,y,8,1);R(P[1],x+2,y-1,4,1);R('#c8a050',x+7,y+3-o,1,3)}
  else if(v.p==1){R(P[1],x+1,y-1,6,1);R('#ffd040',x+7,y+4,1,1+o)}
  else if(v.p==2){rr(P[1],x+1,y-1,6,2);R('#7a4a28',x+7,y+4,1,3-o);R('#b0b0b8',x+7,y+3-o,2,1)}
  else if(v.p==3){rr(P[1],x+1,y-1,6,2);R('#c8c8d8',x+7,y-2,1,7)}
  else R(P[1],x+1,y,6,1)}
const GP=[['#5cae4c','#4a9a40','#80c85c','#b89460'],['#58a05a','#488e4c','#78bc6c','#a8a6b0']],GRD=[];
function bake(E){const c=document.createElement('canvas');c.width=W;c.height=H;const old=g;g=c.getContext('2d');let seed=E*977+7;const r=()=>((seed=seed*16807%2147483647)/2147483647);
  const grass=['#579b49','#4b8d3e','#70b957','#91ca68'],earth=['#b89a62','#a98751','#d0b57a'];
  R('#579b49',0,0,W,H);
  // irregular, layered ground mottling
  for(let i=0;i<600;i++){let x=r()*W|0,y=r()*H|0;R(grass[r()*grass.length|0],x,y,1+(r()*3|0),1+(r()*2|0));if(r()<.16)R('#d8df83',x,y,1,1)}
  // winding village paths, soft edges
  for(let y=0;y<H;y++){let x=54+Math.sin(y/17)*15+Math.sin(y/7)*4;R('#a68a58',x-3,y,8,1);R('#c7aa72',x-2,y,5,1);if(y%9<4)R('#e1c38a',x,y,1,1)}
  for(let x=0;x<W;x++){let y=67+Math.sin(x/15)*7;R('#a68a58',x,y-3,1,7);R('#c7aa72',x,y-2,1,5)}
  // river meanders from upper waterfall to lower pond
  for(let y=0;y<H;y++){let x=23+Math.sin(y/15)*8+Math.sin(y/6)*2;R('#477caa',x-3,y,10,1);R('#287eb5',x-2,y,8,1);R('#55b5dd',x,y,4,1);if(y%8<2)R('#b5efff',x+1,y,3,1)}
  // rocky shores and pebbles
  for(let i=0;i<95;i++){let x=r()*W|0,y=r()*H|0;if(r()<.5)R('#8e987d',x,y,2,1);else R('#d1c19a',x,y,1,1)}
  // clumps of flowers and grasses
  for(let i=0;i<100;i++){let x=r()*W|0,y=r()*H|0;R('#397c36',x,y,1,2);if(i%4===0)R(['#f5e58a','#f6a8b5','#fff0d0'][i%3],x+1,y,1,1)}
  // forest clusters with varied crowns, trunks and highlights
  for(let i=0;i<30;i++){let x=r()*W|0,y=r()*H|0;if(Math.abs(x-(23+Math.sin(y/15)*8))<8)continue;
    R('rgba(25,45,20,.24)',x-2,y+5,9,3);R('#68452b',x+2,y+2,3,7);
    const crown=['#28683b','#347b3d','#4b9346','#5da64c'][r()*4|0];rr(crown,x-2,y-3,10,8);rr('#6bb957',x,y-5,6,5);R('#a2d66b',x+1,y-4,3,2);R('#235c35',x-2,y+1,3,2)}
  // scattered stones, little logs, water plants
  for(let i=0;i<24;i++){let x=r()*W|0,y=r()*H|0;rr('#89958c',x,y,3,2);R('#c2c9b4',x+1,y,1,1)}
  // waterfall glints, bridges and pond reflections
  for(let i=0;i<12;i++){let x=19+(i%3),y=37+i*2;R('#d9f6ff',x,y,2,1);R('#70c9e9',x+2,y+1,2,1)}
  rr('#76502f',48,115,14,5);for(let k=0;k<6;k++)R('#9a7042',49+k*2,116,1,3);R('#d7b27a',48,115,14,1);
  for(const d of DEC){const x=d.x*CS,y=d.y*CS;
    if(d.k==='p'){rr('#e0cc90',x-1,y-1,26,18);rr('#347fae',x,y,24,16);R('#63bde6',x+2,y+2,10,3);R('#b8eaff',x+13,y+7,6,1)}
    else if(d.k==='t'){R('#684328',x+3,y+5,2,4);rr('#245f35',x-1,y,9,7);rr('#398747',x,y-2,7,6);R('#7fc85c',x+1,y-1,3,2);R('#a4d66b',x+3,y,2,1)}
    else if(d.k==='b'){rr('#367c3a',x,y+1,5,4);R('#75bc58',x+1,y+1,2,2);R('#e8df9b',x+3,y,1,1)}
    else if(d.k==='r'){rr('#78877f',x,y+1,4,3);R('#b9c6b4',x+1,y+1,2,1)}
    else {for(let k=0;k<4;k++){R('#b88c53',x+k*4,y+1,1,3);R('#8c653a',x+k*4,y+2,4,1)}R('#e0c28a',x,y,14,1)}}
  g=old;return c}
function river(t){for(let x=0;x<W;x+=2){const y=121+Math.round(Math.sin(x/14)*2);R('#e0cc90',x,y-1,2,1);R('#3f93cf',x,y,2,7);R((x+(t/140|0))%12<2?'#c4eaff':'#68b8e8',x,y+2+(x%4==0),2,1);R('#e0cc90',x,y+7,2,1)}
  rr('#b9783c',55,118,10,16);for(let k=0;k<4;k++)R('#8a5528',56,120+k*3,8,1)}
let lt=0;
function draw(t){const dt=Math.min((t-lt)/1000,.1);lt=t;const E=S.era,nt=night();
  g.save();R('#1a3a20',0,0,W,H);if(shake>.3){g.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));shake*=.85}
  g.drawImage(GRD[E]||(GRD[E]=bake(E)),0,0);river(t);
  // gentle drifting pollen and water sparkle; deterministic positions, animated phase
  for(let k=0;k<13;k++){const px=(k*37+Math.floor(t/95)*(k%3+1))%W,py=(k*23+Math.floor(t/170))%H;
    if(k%3===0)R('#fff2a6',px,py,1,1);else if(k%3===1)R('rgba(226,255,190,.65)',px,py,2,1);else R('#b8edff',px,py,1,1)}
  // wind-touched grass blades around the open meadow
  for(let k=0;k<18;k++){const px=(k*19+4)%W,py=(k*31+Math.floor(t/240)%5)%H;
    if(Math.abs(px-(23+Math.sin(py/15)*8))>10)R(t%800<400?'#86c96a':'#a0d67a',px,py,1,2)}
  for(let i=scars.length-1;i>=0;i--){const s=scars[i];s.l-=dt;if(s.l<=0)scars.splice(i,1);else rr(`rgba(60,40,20,${Math.min(.5,s.l/20*.5)})`,s.x,s.y,s.w,4)}
  R(['#e86a20','#f8c840'][(t/150|0)%2],58,69,3,4);R('#7a4a28',57,73,5,1);
  const it=[];for(const b of S.bl)if(!FS.has(b)){const s=BT[b[0]].s;it.push([b[2]*CS+s*CS,()=>sprite(b[0],b[1]*CS,b[2]*CS,E,t,nt)])}
  for(const v of V){const dx=v.tx-v.x,dy=v.ty-v.y,d=Math.hypot(dx,dy);
    if(d>1.5){v.x+=dx/d*14*dt;v.y+=dy/d*14*dt;v.st=0;v.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?1:0)}
    else{v.st=nt?2:1;v.tm-=dt;if(v.tm<0&&!nt){target(v,false);v.tm=2+Math.random()*4}}
    if(nt&&v.st!=2&&d<=1.5)target(v,true);it.push([v.y+8,()=>vdraw(v,t)])}
  it.sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
  for(let i=fall.length-1;i>=0;i--){const f=fall[i],b=f.b,s=BT[b[0]].s*CS;f.a+=dt;const e=Math.min(1,f.a/f.d),sz=Math.round(s*(.5+.5*e));
    rr(`rgba(20,30,10,${.1+.3*e})`,b[1]*CS+(s-sz)/2|0,b[2]*CS+s-3,sz,4);
    sprite(b[0],b[1]*CS,b[2]*CS-Math.round((1-e*e)*(H-20)),E,t,nt);
    if(e>=1){fall.splice(i,1);FS.delete(b);impact(b)}}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts.splice(i,1);continue}p.vy+=70*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;R(p.c,p.x|0,p.y|0,2,2)}
  const [x0,y0,x1,y1]=TB[S.terr],fg='rgba(8,16,30,.5)';R(fg,0,0,W,y0*CS);R(fg,0,(y1+1)*CS,W,H);R(fg,0,y0*CS,x0*CS,(y1-y0+1)*CS);R(fg,(x1+1)*CS,y0*CS,W,(y1-y0+1)*CS);
  const dark=Math.max(0,-Math.sin(S.t/120*6.283))*.5;if(dark>0){R(`rgba(20,20,70,${dark})`,0,0,W,H);for(let k=3;k>0;k--)rr(`rgba(255,190,80,${.07*dark*3})`,59-k*5,71-k*4,3+k*10,k*8)}
  g.restore();requestAnimationFrame(draw)}
function fit(){const w=$('#world');cv.style.width=Math.max(1,w.clientWidth-8)+'px';cv.style.height=Math.max(1,w.clientHeight-8)+'px'}
addEventListener('resize',fit);

/* ---------- ícones das cartas ---------- */
const IC=[['..yyyy..','.yYYYYy.','yYYooYYy','yYYooYYy','yYYooYYy','yYYooYYy','.yYYYYy.','..yyyy..'],
 ['..hhhh..','.hhhhhh.','.ssssss.','.sesses.','.ssssss.','..bbbb..','.bbbbbb.','.bb..bb.'],
 ['.rr..rr.','rRRrrRRr','rRRRRRRr','rRRRRRRr','.rRRRRr.','..rRRr..','...rr...','........'],
 ['...kk...','.k.KK.k.','..kKKk..','kkKooKkk','kkKooKkk','..kKKk..','.k.KK.k.','...kk...'],
 ['......gg','....gGGg','..gGGGGg','.gGGdGg.','.gGdGGg.','gGdGGg..','gd.gg...','d.......'],
 ['...yy...','...YY...','yyYYYYyy','.yYYYYy.','..yYYy..','..yYYy..','.yY..Yy.','.y....y.']];
const IP={y:'#c08820',Y:'#f4d060',o:'#303848',h:'#6a3a1a',s:'#f8d0a8',e:'#222',b:'#4060c0',r:'#a02030',R:'#f05068',k:'#707888',K:'#b0b8c8',g:'#2a7a30',G:'#58c050',d:'#8a5a30'};
function icon(c,k){const x=c.getContext('2d');x.clearRect(0,0,8,8);IC[k].forEach((row,j)=>[...row].forEach((ch,i)=>{if(IP[ch]){x.fillStyle=IP[ch];x.fillRect(i,j,1,1)}}))}

/* ---------- interface ---------- */
$('#bars').innerHTML=BN.map((n,i)=>`<div class="br" data-i="${i}"><b>${n}</b><div class="sg">${'<i></i>'.repeat(8)}</div><u>!</u></div>`).join('');
$('#bars').onclick=e=>{const r=e.target.closest('.br');if(r)msg(EX[r.dataset.i],6)};
$('#bld').innerHTML=BT.map((b,t)=>`<button class="bb" data-t="${t}"><canvas width="20" height="20"></canvas><b></b><span></span><small></small></button>`).join('');
document.querySelectorAll('.bb canvas').forEach((c,t)=>{const g0=g;g=c.getContext('2d');sprite(t,t==4?2:4,t==4?4:4,0,0,false);g=g0});
$('#bld').onclick=e=>{const b=e.target.closest('.bb');if(b)buy(+b.dataset.t)};
$('#terr').onclick=expand;
$('#fx').onclick=()=>{S.fx=!S.fx};
$('#ov').onclick=e=>{const c=e.target.closest('[data-c]');if(c)choose(+c.dataset.c);if(e.target.dataset.r){noSave=true;localStorage.removeItem(SAVE);location.reload()}if(e.target.dataset.w!==undefined){WEL=''}if(e.target.dataset.start!==undefined){WEL='';msg('Seu mundo está pronto. Construa e evolua o vilarejo.',5)}};
function overlay(){const o=$('#ov'),want=S.over?'o'+S.over:S.pick?'p'+S.pick:WEL?'w':'';if(o.dataset.k===want)return;o.dataset.k=want;o.classList.toggle('on',!!want);if(!want)return;let h;
  if(S.over){const x=FAIL[S.over[0]];h=`<h2>${x[0]}</h2><p>${x[1]}</p><p>Ano ${1+Math.floor(S.t/10)} · ${S.pop} aldeões · ${S.ch} cartas escolhidas · ${ERAS[S.era]}</p><button data-r="1">Recomeçar</button>`}
  else if(S.pick){h=`<h2>Escolha uma carta evolutiva</h2><p>O tempo está parado. A escolha é permanente nesta partida.</p><div class="cards">${S.pick.map(i=>{const k=CARDS[i];return `<button class="cd r${k[2]}" data-c="${i}"><canvas class="ic" width="8" height="8"></canvas><div><b>${k[0]}</b><small>${CAT[k[1]]} · ${RAR[k[2]]}</small><p class="pro">+ ${k[3]}</p><p class="con">− ${k[4]}</p></div></button>`}).join('')}</div>`}
  else if(WEL==='start')h=`<div class="welcome-mark">V</div><p class="eyebrow">UM MUNDO EM EVOLUÇÃO</p><h2>VILARIS</h2><p class="welcome-copy">De um pequeno vilarejo a um reino em expansão. Construa, cuide da população e escolha o rumo da sua civilização.</p><div class="welcome-features"><span>◆ Economia</span><span>◆ Sociedade</span><span>◆ Evolução</span></div><button class="start-btn" data-start="1">Começar a jornada</button><small class="welcome-note">Seu progresso é salvo automaticamente neste dispositivo.</small>`;
  else h=`<h2>Bem-vindo de volta</h2><p>${WEL}</p><button data-w="1">Continuar</button>`;
  $('#ovb').innerHTML=h;if(S.pick)$('#ovb').querySelectorAll('.ic').forEach((c,j)=>icon(c,CARDS[S.pick[j]][1]))}
function ui(){const e=econ(),v=[S.fome,S.hap,S.stab,S.sec,amb()];
  $('#money').textContent=fmt(S.money)+' ouro';$('#inc').textContent='+'+fmt(e.inc)+'/s';$('#popu').textContent='Pop '+S.pop+'/'+e.cap;$('#fx').textContent='Efeitos: '+(S.fx?'reduzidos':'completos');
  document.querySelectorAll('.br').forEach((r,i)=>{const k=Math.round(v[i]/12.5),cl=v[i]<25?'r':v[i]<60?'y':'g';r.querySelectorAll('i').forEach((s,j)=>s.className=j<k?cl:'');r.classList.toggle('crit',v[i]<25)});
  const c=v.findIndex(x=>x<25);$('#msg').textContent=Date.now()<tmT?tmsg:c>=0?CRIT[c]:S.t<30?'Toque nas barras para entender cada atributo.':ERAS[S.era];
  $('#evBar').firstChild.style.width=Math.min(100,S.pe/need()*100)+'%';$('#evTxt').textContent=`Próxima carta: ${fmt(S.pe)} / ${fmt(need())} pontos de evolução · ${ERAS[S.era]}`;
  document.querySelectorAll('.bb').forEach((b,t)=>{const bt=BT[t],cs=cost(t);b.classList.toggle('lock',bt.e>S.era);b.children[1].textContent=`${bt.n} ×${CNT[t]}`;b.children[2].textContent=fmt(cs)+' ouro';b.children[3].textContent='+'+fmt(bt.i*tier(CNT[t]))+'/s · '+bt.d;b.disabled=S.money<cs||!!S.pick||!!S.over});
  const tb=$('#terr');tb.textContent=S.terr>=3?'Território no máximo':`Expandir território (${fmt(tcost())} ouro)`;tb.disabled=S.terr>=3||S.money<tcost();overlay()}
function save(){if(!noSave){S.last=Date.now();localStorage.setItem(SAVE,JSON.stringify(S))}}

/* ---------- laço principal ---------- */
recalc();recount();S.bl.forEach(b=>mark(occ,b[1],b[2],BT[b[0]].s,BT[b[0]].s));
if(!S.bl.length){spawn(0);spawn(0);spawn(1)}
{const dt=(Date.now()-S.last)/1000;if(dt>15&&S.t>0&&!S.over&&!S.pick){const p0=S.pop,m0=S.money;advance(Math.min(dt,OFFCAP));
  WEL=`Você ficou fora ${Math.floor(dt/60)} min. Ouro: +${fmt(S.money-m0)}. População: ${p0} → ${S.pop}.${S.pick?' Uma escolha de carta o aguarda.':''}`}}
let lt2=Date.now();
setInterval(()=>{const n=Date.now(),dt=(n-lt2)/1000;lt2=n;advance(Math.min(dt,OFFCAP));ui()},100);
setInterval(syncV,1000);setInterval(save,10000);addEventListener('beforeunload',save);
fit();setTimeout(fit,100);syncV();ui();requestAnimationFrame(draw);
