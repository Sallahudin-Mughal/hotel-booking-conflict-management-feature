import { useEffect, useRef, useState } from 'react';

const POSTER = 'https://images.pexels.com/videos/7507165/pexels-photo-7507165.jpeg?auto=compress&w=1600';
const VIDEO = 'https://videos.pexels.com/video-files/7507165/7507165-hd_2048_1080_25fps.mp4';

export default function PropertyHero() {
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => {
      setEnabled(!preference.matches);
      if (preference.matches) video.current?.pause();
    };
    applyPreference();
    preference.addEventListener('change', applyPreference);
    return () => preference.removeEventListener('change', applyPreference);
  }, []);

  async function toggleVideo() {
    if (playing) video.current.pause();
    else {
      setEnabled(true);
      try { await video.current.play(); } catch { setPlaying(false); }
    }
  }

  return (
    <header className="property-hero">
      <img className="hero-media" src={POSTER} alt="" fetchPriority="high" />
      <video
        ref={video}
        className="hero-media hero-video"
        src={enabled ? VIDEO : undefined}
        poster={POSTER}
        autoPlay={enabled}
        muted loop playsInline preload="none" aria-hidden="true"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }}
        style={failed ? { display: 'none' } : undefined}
      />
      <div className="hero-shade" />
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#"><span className="brand-mark" aria-hidden="true">D.</span><span>DEMO<span className="brand-subtitle">APARTMENT & STAYS</span></span></a>
        <a className="nav-link" href="#bookings-title">
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2" /></svg>
          <span>View bookings</span>
          <svg className="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </a>
      </nav>
      <div className="hero-content">
        <p className="eyebrow"><span /> A LITTLE SPACE. A BETTER STAY.</p>
        <h1>Beautiful stays.<br /><em>Seamlessly planned.</em></h1>
        <p className="hero-description">A considered space for every guest.<br />A clear plan for every arrival.</p>
        <div className="property-tag"><span aria-hidden="true">⌂</span> Demo Apartment <span className="tag-divider" /> Booking workspace</div>
      </div>
      {!failed && <button className="video-toggle" type="button" onClick={toggleVideo} aria-label={playing ? 'Pause background video' : 'Play background video'}>{playing ? 'Ⅱ' : '▷'} <span>{playing ? 'Pause' : 'Play'} scenery</span></button>}
    </header>
  );
}
