import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; r: number; s: number; d: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; len: number };

export function StarField() {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current; if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const style=getComputedStyle(canvas);
  const starColor=style.color||'#fff';
  const cyan=style.getPropertyValue('--cyan').trim()||'#8fd6ff';
  let width=0,height=0,raf=0,last=performance.now();
  const stars:Star[]=Array.from({length:170},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.2,s:Math.random()*6,d:Math.random()*.8+.25}));
  const meteors:Meteor[]=[];
  const spawn=()=>{
   if(meteors.length>=3)return;
   const fromLeft=Math.random()>.3;
   const speed=Math.random()*4+8;
   const ang=(Math.random()*18+16)*Math.PI/180;
   meteors.push({
    x:fromLeft?-30:width*(Math.random()*.5+.25),
    y:Math.random()*height*.35-20,
    vx:Math.cos(ang)*speed*(fromLeft?1:-1),
    vy:Math.sin(ang)*speed,
    life:0,max:70+Math.random()*50,len:110+Math.random()*90,
   });
  };
  const resize=()=>{width=window.innerWidth;height=window.innerHeight;canvas.width=width;canvas.height=height;};resize();
  const drawStars=(time:number)=>{
   for(const s of stars){
    const y=(s.y*height+(reduced?0:time*.003*s.d))%height;
    ctx.globalAlpha=reduced?.55:.22+(Math.sin(time/1200+s.s)+1)*.34;
    ctx.fillStyle=s.d>.8?cyan:starColor;
    ctx.beginPath();ctx.arc(s.x*width,y,s.r,0,Math.PI*2);ctx.fill();
   }
  };
  const drawMeteors=(dt:number)=>{
   if(!reduced&&Math.random()<dt*.35)spawn();
   for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i];if(!m)continue;
    m.x+=m.vx*dt;m.y+=m.vy*dt;m.life+=dt;
    const fade=Math.min(1,m.life/8)*Math.max(0,1-m.life/m.max);
    if(fade<=0||m.x<-160||m.y>height+160||m.x>width+160){meteors.splice(i,1);continue;}
    const tx=m.x-m.vx/8*m.len/10,ty=m.y-m.vy/8*m.len/10;
    const grad=ctx.createLinearGradient(m.x,m.y,tx,ty);
    grad.addColorStop(0,`rgba(255,255,255,${.9*fade})`);
    grad.addColorStop(.25,`rgba(160,220,255,${.55*fade})`);
    grad.addColorStop(1,'rgba(160,220,255,0)');
    ctx.strokeStyle=grad;ctx.globalAlpha=1;ctx.lineWidth=1.6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(tx,ty);ctx.stroke();
    ctx.fillStyle=`rgba(255,255,255,${.95*fade})`;
    ctx.beginPath();ctx.arc(m.x,m.y,1.6,0,Math.PI*2);ctx.fill();
   }
  };
  const frame=(now:number)=>{
   const dt=Math.min(.05,(now-last)/1000);last=now;
   ctx.clearRect(0,0,width,height);
   drawStars(now);
   drawMeteors(dt*60);
   ctx.globalAlpha=1;
   raf=requestAnimationFrame(frame);
  };
  if(reduced){ctx.clearRect(0,0,width,height);drawStars(0);ctx.globalAlpha=1;}
  else raf=requestAnimationFrame(frame);
  window.addEventListener('resize',()=>{resize();if(reduced){ctx.clearRect(0,0,width,height);drawStars(0);ctx.globalAlpha=1;}});
  return()=>cancelAnimationFrame(raf);
 },[]);
 return <canvas ref={ref} className="star-field" aria-hidden="true"/>;
}
