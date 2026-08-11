'use client';

import { useEffect, useRef, useState } from 'react';

type Brother = { id: string; name: string };

// Single source of truth for timing -- CSS keyframes only describe the
// shape of each animation (percentages), these constants control the
// actual duration via inline `animationDuration`, so JS timers and the
// CSS animation can never drift out of sync.
const WELCOME_MS = 3200;
const NAME_MS = 2600;
const TRANSITION_MS = 700;

type Phase = 'welcome' | 'reveal' | 'transitioning' | 'final';

export default function HomeExperience({
  brothers,
  loadError,
}: {
  brothers: Brother[];
  loadError: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [index, setIndex] = useState(0);
  // Two separate refs, not one shared ref: the reveal-cycle timer and the
  // phase-transition timer must be cancellable independently. Sharing one
  // ref caused a real bug -- clicking "Skip" during the reveal phase set a
  // new transition timer, but then React's cleanup for the just-exited
  // reveal effect cleared that same ref an instant later, cancelling the
  // brand-new transition timer and leaving the UI stuck mid-fade.
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRevealTimer() {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

  function clearTransitionTimer() {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }

  function goToFinal(delay: number) {
    clearRevealTimer();
    clearTransitionTimer();
    setPhase('transitioning');
    transitionTimerRef.current = setTimeout(() => setPhase('final'), delay);
  }

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || loadError || brothers.length === 0) {
      setPhase('final');
      return;
    }

    setPhase('welcome');
    setIndex(0);
    transitionTimerRef.current = setTimeout(() => setPhase('reveal'), WELCOME_MS);

    return clearTransitionTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError, brothers.length]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    revealTimerRef.current = setTimeout(() => {
      if (index + 1 < brothers.length) {
        setIndex((i) => i + 1);
      } else {
        goToFinal(TRANSITION_MS);
      }
    }, NAME_MS);

    return clearRevealTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, brothers.length]);

  function handleSkip() {
    goToFinal(300);
  }

  const showOverlay = phase !== 'final';

  return (
    <>
      {showOverlay && (
        <div className={`intro-overlay${phase === 'transitioning' ? ' intro-overlay-fading' : ''}`}>
          <div className="intro-glow intro-glow-a" aria-hidden="true" />
          <div className="intro-glow intro-glow-b" aria-hidden="true" />

          {phase === 'welcome' && (
            <h1 className="intro-title" style={{ animationDuration: `${WELCOME_MS}ms` }}>
              स्वागत छ प्रदेशी दाजुभाइहरू
            </h1>
          )}

          {(phase === 'reveal' || phase === 'transitioning') && brothers[index] && (
            <div className="name-reveal" aria-live="polite">
              <p className="name-reveal-label">दाजुभाइहरू</p>
              <p
                key={brothers[index].id}
                className="name-reveal-name"
                style={{ animationDuration: `${NAME_MS}ms` }}
              >
                {brothers[index].name}
              </p>
              <p className="name-reveal-progress">
                {index + 1} / {brothers.length}
              </p>
            </div>
          )}

          {(phase === 'welcome' || phase === 'reveal') && (
            <button type="button" className="skip-intro-button" onClick={handleSkip}>
              Skip Intro →
            </button>
          )}
        </div>
      )}

      {phase === 'final' && (
        <div className="home-final">
          <header>
            <div className="container header-flex">
              <div>
                <h1>प्रदेशी दाजुभाइ समूह</h1>
              </div>
              <nav className="top-menu">
                <a href="/admin">Admin</a>
              </nav>
            </div>
          </header>
          <main>
            <section className="members container">
              <h2>दाजुभाइहरू</h2>
              <ol>
                {loadError && <li>सूची लोड गर्न सकिएन। पछि फेरि प्रयास गर्नुहोस्।</li>}
                {!loadError && brothers.length === 0 && <li>कुनै दाजुभाइ छैनन्।</li>}
                {!loadError && brothers.map((brother) => <li key={brother.id}>{brother.name}</li>)}
              </ol>
            </section>
          </main>
          <footer>
            <div className="container">
              <p>© 2026 प्रदेशी दाजुभाइ समूह</p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
