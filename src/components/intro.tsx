import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import introCosmos from '@/assets/intro-cosmos.jpg';
import { StarField } from '@/components/star-field';

export function Intro({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    startButton.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);

  async function start() {
    const player = video.current;
    if (!player) return;
    setFailed(false);
    try {
      player.muted = muted;
      await player.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setFailed(true);
    }
  }

  return (
    <div className="intro intro-video-dialog" role="dialog" aria-modal="true" aria-label="ASTRA intro"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
        if (event.key === 'Tab') {
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <video ref={video} className="intro-video" playsInline preload="auto" muted={muted}
        onEnded={onClose} onError={() => { setFailed(true); setPlaying(false); }}>
        <source src="/intro/astra-intro.webm" type="video/webm" />
        <source src="/intro/astra-intro.mp4" type="video/mp4" />
      </video>
      <div className="intro-top">
        <span className="eyebrow">ASTRA</span>
        <Button variant="glass" onClick={onClose}>O‘tkazib yuborish <ArrowRight /></Button>
      </div>
      {!playing && <div className="intro-video-start">
        <img className="intro-start-cosmos" src={introCosmos} alt="" width={1920} height={1088} />
        <StarField mode="idle" />
        <div className="intro-start-copy"><h1>ASTRA</h1><p>Ta’limning yangi olami</p></div>
        <Button ref={startButton} variant="cosmic" size="lg" onClick={() => void start()}>
          {failed ? <RotateCcw /> : <Play />} {failed ? 'Qayta urinish' : 'Sayohatni boshlash'}
        </Button>
        {failed && <p role="alert">Video ochilmadi. Qayta urinishingiz yoki o‘tkazib yuborishingiz mumkin.</p>}
      </div>}
      <div className="intro-bottom">
        <span>Ta’limning yangi olami</span>
        <Button variant="glass" size="icon" aria-label={muted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
          onClick={() => setMuted(value => !value)}>{muted ? <VolumeX /> : <Volume2 />}</Button>
      </div>
    </div>
  );
}