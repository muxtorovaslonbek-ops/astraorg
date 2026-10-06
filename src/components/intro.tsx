import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import universe from '@/assets/astra-universe.jpg';
import { StarField } from './star-field';

export function Intro({onClose}:{onClose:()=>void}) {
 const [playing,setPlaying]=useState(false);const [muted,setMuted]=useState(false);const audio=useRef<AudioContext|null>(null);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(onClose,6500);return()=>clearTimeout(timer);},[playing,onClose]);
 useEffect(()=>()=>{void audio.current?.close();},[]);
 function start(){setPlaying(true);try{const ctx=new AudioContext();audio.current=ctx;if(muted)void ctx.suspend();else void ctx.resume();
  const t0=ctx.currentTime;
  const len=Math.floor(ctx.sampleRate*1.5);const buf=ctx.createBuffer(1,len,ctx.sampleRate);const data=buf.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
  const noise=ctx.createBufferSource();noise.buffer=buf;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=.8;bp.frequency.setValueAtTime(200,t0);bp.frequency.exponentialRampToValueAtTime(1800,t0+1.1);
  const ng=ctx.createGain();ng.gain.setValueAtTime(.11,t0);ng.gain.exponentialRampToValueAtTime(.001,t0+1.6);
  noise.connect(bp);bp.connect(ng);ng.connect(ctx.destination);noise.start();
  const pad=(freqs:number[],at:number)=>{freqs.forEach(f=>{const o=ctx.createOscillator();const g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.05,at+.8);g.gain.exponentialRampToValueAtTime(.001,at+5.6);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+5.7);});};
  pad([130.81,196,261.63],t0+.2);pad([146.83,220,349.23],t0+2.4);pad([174.61,261.63,392],t0+4.5);
  [261.63,329.63,392,523.25,659.25,783.99].forEach((f,i)=>{const at=t0+.6+i*.55;const o=ctx.createOscillator();const g=ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.07,at+.05);g.gain.exponentialRampToValueAtTime(.001,at+.9);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+1);});
  [1046.5,1318.51,1567.98].forEach((f,i)=>{const at=t0+4.4+i*.55;const o=ctx.createOscillator();const g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.04,at+.03);g.gain.exponentialRampToValueAtTime(.001,at+.8);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+.9);});
 }catch{/* The intro remains available without audio. */}}
 function toggle(){setMuted(v=>!v);if(audio.current){if(muted)void audio.current.resume();else void audio.current.suspend();}}
 return <div className={`intro ${playing?'intro-playing':''}`} role="dialog" aria-modal="true" aria-label="ASTRA intro">
  <img src={universe} alt="Koinotdagi ta’lim olami" className="intro-backdrop" width={1920} height={1024}/><div className="intro-shade"/><StarField/><div className="intro-dust" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
  <div className="intro-top"><span className="eyebrow">YANGI OLAMGA XUSH KELIBSIZ</span><Button variant="glass" onClick={onClose}>O‘tkazib yuborish <ArrowRight/></Button></div>
  <div className="intro-center"><div className="intro-emblem"><img src="/favicon.svg" alt=""/><span className="intro-orbit"/></div><h1>ASTRA</h1><h2>Ta’limning yangi olami</h2><p>Bilimni o‘rganing. Tajriba qiling. Kashf eting.</p>
  {playing?<div className="intro-progress"><span/><small>YULDUZLAR SARI…</small></div>:<Button variant="cosmic" size="lg" onClick={start}><Play/> Sayohatni boshlash <Volume2/></Button>}</div>
  <div className="intro-bottom"><span>Bilim chegaralarni bilmaydi.</span><Button variant="glass" size="icon" aria-label={muted?'Ovozni yoqish':'Ovozni o‘chirish'} onClick={toggle}>{muted?<VolumeX/>:<Volume2/>}</Button></div>
 </div>;
}