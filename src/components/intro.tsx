import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import universe from '@/assets/astra-universe.jpg';
import { StarField } from './star-field';

export function Intro({onClose}:{onClose:()=>void}) {
 const [playing,setPlaying]=useState(false);const [muted,setMuted]=useState(false);const audio=useRef<AudioContext|null>(null);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(onClose,6500);return()=>clearTimeout(timer);},[playing,onClose]);
 useEffect(()=>()=>{void audio.current?.close();},[]);
 function start(){setPlaying(true);try{const ctx=new AudioContext();audio.current=ctx;if(muted)void ctx.suspend();else void ctx.resume();[130.81,196,261.63,392,523.25].forEach((freq,i)=>{const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.065,ctx.currentTime+.5+i*.25);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+6);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+6.3);});}catch{/* The intro remains available without audio. */}}
 function toggle(){setMuted(v=>!v);if(audio.current){if(muted)void audio.current.resume();else void audio.current.suspend();}}
 return <div className={`intro ${playing?'intro-playing':''}`} role="dialog" aria-modal="true" aria-label="ASTRA intro">
  <img src={universe} alt="Koinotdagi ta’lim olami" className="intro-backdrop" width={1920} height={1024}/><div className="intro-shade"/><StarField/>
  <div className="intro-top"><span className="eyebrow">YANGI OLAMGA XUSH KELIBSIZ</span><Button variant="glass" onClick={onClose}>O‘tkazib yuborish <ArrowRight/></Button></div>
  <div className="intro-center"><div className="intro-emblem"><img src="/favicon.svg" alt=""/><span className="intro-orbit"/></div><h1>ASTRA</h1><h2>Ta’limning yangi olami</h2><p>Bilimni o‘rganing. Tajriba qiling. Kashf eting.</p>
  {playing?<div className="intro-progress"><span/><small>YULDUZLAR SARI…</small></div>:<Button variant="cosmic" size="lg" onClick={start}><Play/> Sayohatni boshlash <Volume2/></Button>}</div>
  <div className="intro-bottom"><span>Bilim chegaralarni bilmaydi.</span><Button variant="glass" size="icon" aria-label={muted?'Ovozni yoqish':'Ovozni o‘chirish'} onClick={toggle}>{muted?<VolumeX/>:<Volume2/>}</Button></div>
 </div>;
}