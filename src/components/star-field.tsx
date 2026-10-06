import { useEffect, useRef } from 'react';

export function StarField() {
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current; if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  let frame=0; let width=0,height=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors=getComputedStyle(canvas).color;
  const stars=Array.from({length:120},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.25,s:Math.random()*6}));
  const resize=()=>{width=window.innerWidth;height=window.innerHeight;canvas.width=width;canvas.height=height;};resize();
  const draw=(time:number)=>{ctx.clearRect(0,0,width,height);ctx.fillStyle=colors;for(const s of stars){ctx.globalAlpha=reduced?.6:.3+(Math.sin(time/1500+s.s)+1)*.3;ctx.beginPath();ctx.arc(s.x*width,(s.y*height+(reduced?0:time*.003))%height,s.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(!reduced)frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);
  window.addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);};
 },[]);
 return <canvas ref={ref} className="star-field" aria-hidden="true"/>;
}