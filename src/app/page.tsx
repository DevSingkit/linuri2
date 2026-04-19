// src/app/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:       #1a7a40;
          --green-dark:  #0d3d20;
          --green-mid:   #1f6b38;
          --green-light: #eaf6ef;
          --gold:        #f0a500;
          --gold-lt:     #ffd166;
          --gold-bg:     #fffbf0;
          --cream:       #fdfaf5;
          --cream2:      #f5efe3;
          --white:       #ffffff;
          --text:        #1a1f16;
          --muted:       #6b7280;
          --border:      rgba(26,122,64,0.13);
          --r:           12px;
          --r-lg:        18px;
          --r-xl:        26px;
          --font:        'Plus Jakarta Sans', sans-serif;
        }

        .lp {
          font-family: var(--font);
          background: var(--cream);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(253,250,245,0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 62px;
        }
        .lp-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .lp-nav-mark {
          width: 36px;
          height: 36px;
          background: var(--green-dark);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font);
          font-size: 1rem;
          font-weight: 800;
          color: var(--gold-lt);
          flex-shrink: 0;
          letter-spacing: -0.5px;
        }
        .lp-nav-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: 0.01em;
        }
        .lp-nav-chip {
          background: var(--gold);
          color: var(--green-dark);
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 5px;
          align-self: flex-start;
          margin-top: 7px;
          margin-left: 2px;
        }
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-ghost {
          background: transparent;
          color: var(--green-dark);
          border: 1.5px solid var(--border);
          border-radius: 9px;
          padding: 0.46rem 1.15rem;
          font-family: var(--font);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-ghost:hover { background: var(--green-light); border-color: var(--green); }
        .btn-solid {
          background: var(--green-dark);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 0.46rem 1.25rem;
          font-family: var(--font);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-solid:hover { background: var(--green); transform: translateY(-1px); }

        /* ── HERO ── */
        .lp-hero {
          background: var(--green-dark);
          position: relative;
          overflow: hidden;
          padding: 6rem 2.5rem 5rem;
          text-align: center;
        }
        .lp-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .lp-hero-bg::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%);
          top: -200px;
          left: -100px;
        }
        .lp-hero-bg::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          bottom: -100px;
          right: 5%;
        }
        .lp-hero-dots {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(240,165,0,0.12);
          border: 1px solid rgba(240,165,0,0.28);
          color: var(--gold-lt);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 0.38rem 1rem;
          border-radius: 999px;
          margin-bottom: 1.75rem;
          position: relative;
        }
        .lp-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--gold);
          animation: lp-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes lp-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .lp-hero h1 {
          font-size: clamp(2.4rem, 5.5vw, 3.8rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          max-width: 740px;
          margin: 0 auto 1.25rem;
          letter-spacing: -0.02em;
          position: relative;
        }
        .lp-hero h1 em {
          font-style: italic;
          color: var(--gold-lt);
        }
        .lp-hero-sub {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.58);
          font-weight: 400;
          max-width: 510px;
          margin: 0 auto 2.5rem;
          line-height: 1.72;
          position: relative;
        }
        .lp-hero-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
          position: relative;
        }
        .btn-hero-prim {
          background: var(--gold);
          color: var(--green-dark);
          border: none;
          border-radius: 11px;
          padding: 0.9rem 2.1rem;
          font-family: var(--font);
          font-size: 0.97rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: -0.01em;
        }
        .btn-hero-prim:hover {
          background: var(--gold-lt);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(240,165,0,0.35);
        }
        .btn-hero-sec {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.88);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 11px;
          padding: 0.9rem 2.1rem;
          font-family: var(--font);
          font-size: 0.97rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-hero-sec:hover { background: rgba(255,255,255,0.13); }
        .lp-hero-badges {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 18px;
          position: relative;
        }
        .lp-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.42);
          font-size: 0.79rem;
          font-weight: 500;
        }
        .lp-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        /* ── SUBJECT STRIP ── */
        .lp-subjects {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 2rem 2.5rem 0;
        }
        .lp-subj {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0.55rem 1.25rem;
          border-radius: 999px;
          font-size: 0.88rem;
          font-weight: 700;
          border: 2px solid transparent;
          transition: transform 0.15s;
          cursor: default;
        }
        .lp-subj:hover { transform: translateY(-2px); }
        .lp-subj-en { background: #eaf6ef; color: #0d3d20; border-color: #b8dfc8; }
        .lp-subj-ma { background: var(--gold-bg); color: #7a5500; border-color: #f5d07a; }
        .lp-subj-sc { background: #edf2ff; color: #2c4da0; border-color: #bcceff; }

        /* ── SCHOOL STRIP ── */
        .lp-school {
          background: var(--gold-bg);
          border-top: 1px solid rgba(240,165,0,0.2);
          border-bottom: 1px solid rgba(240,165,0,0.2);
          padding: 14px 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          text-align: center;
          margin-top: 1.5rem;
        }
        .lp-school-label {
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b07800;
        }
        .lp-school-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--green-dark);
        }
        .lp-school-sep {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        /* ── GENERIC SECTION ── */
        .lp-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }
        .lp-eyebrow-sm {
          font-size: 0.63rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.5rem;
        }
        .lp-section-title {
          font-size: clamp(1.75rem, 3.2vw, 2.4rem);
          font-weight: 800;
          color: var(--green-dark);
          line-height: 1.12;
          margin-bottom: 0.9rem;
          letter-spacing: -0.02em;
        }
        .lp-section-desc {
          color: var(--muted);
          font-size: 0.97rem;
          line-height: 1.72;
          max-width: 520px;
          margin-bottom: 2.75rem;
        }

        /* ── FEATURE GRID ── */
        .lp-feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
        }
        .lp-feat {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: var(--r-lg);
          padding: 1.5rem 1.75rem;
          transition: border-color 0.18s, transform 0.15s, box-shadow 0.15s;
        }
        .lp-feat:hover {
          border-color: var(--green);
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(26,122,64,0.09);
        }
        .lp-feat-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }
        .fi-g { background: #eaf6ef; }
        .fi-y { background: var(--gold-bg); }
        .fi-r { background: #fff0f0; }
        .fi-b { background: #edf2ff; }
        .fi-p { background: #f4eeff; }
        .lp-feat h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--green-dark);
          margin-bottom: 0.4rem;
          letter-spacing: -0.01em;
        }
        .lp-feat p {
          font-size: 0.86rem;
          color: var(--muted);
          line-height: 1.65;
        }
        .lp-feat-tag {
          display: inline-block;
          margin-top: 0.8rem;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 3px 8px;
          border-radius: 5px;
        }
        .tag-ai { background: #f4eeff; color: #6030c0; }
        .tag-live { background: #eaf6ef; color: #0d5c28; }
        .tag-warn { background: #fff0f0; color: #9b1c1c; }

        /* ── HOW IT WORKS ── */
        .lp-how-wrap {
          background: var(--green-dark);
          position: relative;
          overflow: hidden;
        }
        .lp-how-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse 100% 100% at 50% 50%, black 40%, transparent 100%);
        }
        .lp-how {
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2rem;
          position: relative;
        }
        .lp-how .lp-eyebrow-sm { color: rgba(240,165,0,0.75); }
        .lp-how .lp-section-title { color: #fff; }
        .lp-how .lp-section-desc { color: rgba(255,255,255,0.48); }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(224px, 1fr));
          gap: 14px;
        }
        .lp-step {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: var(--r-lg);
          padding: 1.5rem 1.6rem;
          position: relative;
          overflow: hidden;
          transition: background 0.15s;
        }
        .lp-step:hover { background: rgba(255,255,255,0.075); }
        .lp-step-bg-num {
          position: absolute;
          right: -4px;
          bottom: -16px;
          font-size: 5.5rem;
          font-weight: 800;
          line-height: 1;
          color: rgba(255,255,255,0.04);
          pointer-events: none;
          letter-spacing: -4px;
        }
        .lp-step-n {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(240,165,0,0.75);
          margin-bottom: 0.55rem;
        }
        .lp-step h3 {
          font-size: 0.97rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }
        .lp-step p {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.46);
          line-height: 1.62;
        }

        /* ── ROLES ── */
        .lp-roles {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .lp-role {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: var(--r-lg);
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lp-role:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(26,122,64,0.09);
        }
        .lp-role-head {
          padding: 1.2rem 1.5rem 1rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .lp-role-av {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }
        .av-s { background: #eaf6ef; }
        .av-t { background: var(--gold-bg); }
        .av-a { background: #fff0f0; }
        .lp-role-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--green-dark);
          letter-spacing: -0.01em;
        }
        .lp-role-sub {
          font-size: 0.63rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          color: var(--muted);
          margin-top: 2px;
        }
        .lp-role-body {
          padding: 1rem 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lp-role-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .lp-role-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          margin-top: 5px;
        }

        /* ── MASTERY LEVELS ── */
        .lp-mastery-wrap {
          background: var(--cream2);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .lp-mastery {
          max-width: 1080px;
          margin: 0 auto;
          padding: 4.5rem 2rem;
        }
        .lp-mastery-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 13px;
          margin-top: 2.5rem;
        }
        .lp-mc {
          border-radius: var(--r);
          padding: 1.35rem 1.5rem;
          transition: transform 0.15s;
          cursor: default;
        }
        .lp-mc:hover { transform: translateY(-2px); }
        .lp-mc-nh { background: #fff0f0; border: 2px solid rgba(155,28,28,0.14); }
        .lp-mc-dv { background: var(--gold-bg); border: 2px solid rgba(200,130,0,0.18); }
        .lp-mc-ms { background: #eaf6ef; border: 2px solid rgba(26,122,64,0.18); }
        .lp-mc-icon { font-size: 1.4rem; margin-bottom: 0.55rem; display: block; }
        .lp-mc-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.45rem;
          letter-spacing: -0.01em;
        }
        .lp-mc-nh .lp-mc-title { color: #8b1a1a; }
        .lp-mc-dv .lp-mc-title { color: #7a5500; }
        .lp-mc-ms .lp-mc-title { color: #0d3d20; }
        .lp-mc p {
          font-size: 0.83rem;
          color: var(--muted);
          line-height: 1.62;
        }

        /* ── CTA ── */
        .lp-cta {
          background: var(--green-dark);
          text-align: center;
          padding: 5.5rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .lp-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 110%, rgba(240,165,0,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-cta h2 {
          font-size: clamp(1.9rem, 3.8vw, 2.8rem);
          font-weight: 800;
          color: #fff;
          max-width: 580px;
          margin: 0 auto 1rem;
          line-height: 1.12;
          letter-spacing: -0.02em;
          position: relative;
        }
        .lp-cta p {
          color: rgba(255,255,255,0.5);
          font-size: 0.98rem;
          margin-bottom: 2.5rem;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
          position: relative;
        }
        .lp-cta-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
        }

        /* ── FOOTER ── */
        .lp-footer {
          background: #060d09;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 2.25rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .lp-footer-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .lp-footer-mark {
          width: 28px;
          height: 28px;
          background: var(--gold);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--green-dark);
          flex-shrink: 0;
        }
        .lp-footer-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
        }
        .lp-footer-meta {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.24);
          text-align: right;
          line-height: 1.8;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .lp-nav { padding: 0 1.25rem; }
          .btn-ghost { display: none; }
          .lp-hero { padding: 3.5rem 1.25rem 3rem; }
          .lp-subjects { padding: 1.75rem 1.25rem 0; }
          .lp-school { padding: 1rem 1.25rem; }
          .lp-section { padding: 3.5rem 1.25rem; }
          .lp-how { padding: 3.5rem 1.25rem; }
          .lp-mastery { padding: 3rem 1.25rem; }
          .lp-footer { padding: 1.75rem 1.25rem; flex-direction: column; align-items: flex-start; }
          .lp-footer-meta { text-align: left; }
        }
      `}</style>

      <div className="lp">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-nav-brand">
            <div className="lp-nav-mark">U</div>
            <span className="lp-nav-name">UMCLS</span>
          </div>
          <div className="lp-nav-actions">
            <button className="btn-ghost" onClick={() => router.push('/login')}>Log in</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-bg" />
          <div className="lp-hero-dots" />
          <div style={{ position: 'relative' }}>
            <div className="lp-eyebrow">
              <span className="lp-pulse" />
              United Methodist Cooperative Learning System
            </div>
            <h1>
              Every student learns at their <em>own pace.</em>
            </h1>
            <p className="lp-hero-sub">
              LINURI tracks students' activity in subjects — then adapts the difficulty so that the teacher can have a better understanding of each student's progress.
            </p>
            <div className="lp-hero-btns">
              <button className="btn-hero-prim" onClick={() => router.push('/login')}>
                ✦ Get Started
              </button>
            </div>
            <div className="lp-hero-badges">
              {['Flexibility', ' Mastery Tracking', 'Learning Hints', 'Adaptive Difficulty'].map(b => (
                <span key={b} className="lp-badge">
                  <span className="lp-badge-dot" />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SUBJECT CHIPS ── */}
        <div className="lp-subjects">
          <div className="lp-subj lp-subj-en">English</div>
          <div className="lp-subj lp-subj-ma">Mathematics</div>
          <div className="lp-subj lp-subj-sc">Science</div>
          <div className="lp-subj lp-subj-en">Others</div>
        </div>

        {/* ── SCHOOL STRIP ── */}
        <div className="lp-school">
          <span className="lp-school-label">Developed for</span>
          <span className="lp-school-sep" />
          <span className="lp-school-name">United Methodist Cooperative Learning System, Inc.</span>
          <span className="lp-school-sep" />
          <span className="lp-school-label">Caloocan City</span>
        </div>

        {/* ── FEATURES ── */}
        <div className="lp-section">
          <div className="lp-eyebrow-sm">What LINURI Does</div>
          <h2 className="lp-section-title">Smarter learning,<br />powered by AI</h2>
          <p className="lp-section-desc">
            LINURI combines a decision-tree classifier with Google Gemini to give every student a personalized learning path — automatically.
          </p>
          <div className="lp-feat-grid">
            {[
              { icon: '🎯', color: 'fi-g', title: 'Adaptive Difficulty', tag: 'tag-live', tagLabel: 'Auto-adjusts', desc: "After every quiz, LINURI adjusts the difficulty level — Basic, Standard, or Advanced — based on the student's mastery score." },
              { icon: '💡', color: 'fi-y', title: 'AI-Generated Hints', tag: 'tag-ai', tagLabel: 'Gemini AI', desc: 'When a student is stuck, Gemini AI generates a context-aware hint for the question — no generic answers.' },
              { icon: '📊', color: 'fi-b', title: 'Mastery Tracking', tag: 'tag-live', tagLabel: 'Live Data', desc: 'Every quiz attempt is saved. Teachers and admins can see who is Mastered, Developing, or Needs Help at a glance.' },
              { icon: '🚩', color: 'fi-r', title: 'Regression Alerts', tag: 'tag-warn', tagLabel: 'Early Warning', desc: 'Students who regress two or more times on a skill are automatically flagged so teachers can intervene early.' },
              { icon: '📝', color: 'fi-y', title: 'Teacher Lesson Builder', tag: 'tag-ai', tagLabel: 'Gemini AI', desc: 'Teachers input a lesson topic and LINURI auto-generates multiple-choice questions using Gemini — ready to review and publish.' },
              { icon: '🏫', color: 'fi-g', title: 'Class Management', tag: 'tag-live', tagLabel: 'Simple Setup', desc: 'Create class sections with auto-generated join codes. Students enrol instantly — no manual setup needed.' },
            ].map(f => (
              <div key={f.title} className="lp-feat">
                <div className={`lp-feat-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className={`lp-feat-tag ${f.tag}`}>{f.tagLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="lp-how-wrap">
          <div className="lp-how">
            <div className="lp-eyebrow-sm">How It Works</div>
            <h2 className="lp-section-title">From lesson to mastery<br />in four steps</h2>
            <p className="lp-section-desc">
              The adaptive loop keeps running until every student reaches mastery.
            </p>
            <div className="lp-steps">
              {[
                { n: '01', title: 'Teacher creates a lesson', desc: 'Enter a topic, subject, and difficulty. Gemini generates 10 multiple-choice questions automatically.' },
                { n: '02', title: 'Student takes the quiz', desc: 'Each question has a 60-second timer. Hints are available when time runs out or when the student asks.' },
                { n: '03', title: 'Classifier scores mastery', desc: 'The decision-tree analyses accuracy and assigns a mastery level: Needs Help, Developing, or Mastered.' },
                { n: '04', title: 'Adaptive router picks next step', desc: 'Based on mastery, the system routes the student to the right difficulty level for the next quiz.' },
              ].map(s => (
                <div key={s.n} className="lp-step">
                  <div className="lp-step-bg-num">{s.n}</div>
                  <div className="lp-step-n">Step {s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROLES ── */}
        <div className="lp-section">
          <div className="lp-eyebrow-sm">User Roles</div>
          <h2 className="lp-section-title">Built for everyone<br />in the classroom</h2>
          <p className="lp-section-desc">
            LINURI has three distinct roles, each with their own dashboard and tools.
          </p>
          <div className="lp-roles">
            {[
              {
                av: 'av-s', icon: '👦', role: 'Student', sub: 'join via class link',
                items: ['Take adaptive quizzes in Any Subject', 'Get AI-powered hints for some help without giving out the answer', 'Track personal mastery progress over time', 'Enrol in class with a join code'],
              },
              {
                av: 'av-t', icon: '👩‍🏫', role: 'Teacher', sub: 'Created by admin',
                items: ['Create class sections with join codes', 'Generate lessons and questions via Gemini AI', 'Review and approve questions before publishing', 'Monitor class mastery and flagged students'],
              },
              {
                av: 'av-a', icon: '🏛', role: 'Admin', sub: 'Manually created',
                items: ['View all users, classes, and mastery records', 'Access school-wide mastery report by subject', 'Print reports directly from the dashboard', 'Oversee the entire LINURI system'],
              },
            ].map(r => (
              <div key={r.role} className="lp-role">
                <div className="lp-role-head">
                  <div className={`lp-role-av ${r.av}`}>{r.icon}</div>
                  <div>
                    <div className="lp-role-title">{r.role}</div>
                    <div className="lp-role-sub">{r.sub}</div>
                  </div>
                </div>
                <div className="lp-role-body">
                  {r.items.map(item => (
                    <div key={item} className="lp-role-item">
                      <span className="lp-role-dot" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MASTERY LEVELS ── */}
        <div className="lp-mastery-wrap">
          <div className="lp-mastery">
            <div className="lp-eyebrow-sm">Mastery Framework</div>
            <h2 className="lp-section-title">Three levels. One goal: Mastery.</h2>
            <div className="lp-mastery-cards">
              {[
                { cls: 'lp-mc-nh', icon: '📌', title: 'Needs Help', desc: 'The student scored below the threshold. LINURI steps down to Basic difficulty and encourages re-attempt with hints enabled.' },
                { cls: 'lp-mc-dv', icon: '📈', title: 'Developing', desc: 'The student is on track but not yet consistent. LINURI keeps difficulty at Standard and monitors for regression.' },
                { cls: 'lp-mc-ms', icon: '🌟', title: 'Mastered', desc: 'The student has demonstrated consistent accuracy. LINURI advances them to Advanced difficulty for continued growth.' },
              ].map(m => (
                <div key={m.cls} className={`lp-mc ${m.cls}`}>
                  <span className="lp-mc-icon">{m.icon}</span>
                  <div className="lp-mc-title">{m.title}</div>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="lp-cta">
          <h2>Ready to start your<br />adaptive learning journey?</h2>
          <p>
            Join the students and teachers of United Methodist Cooperative Learning System, Inc.
          </p>
          <div className="lp-cta-btns">
            <button className="btn-hero-prim" onClick={() => router.push('/register')}>
              ✦ Log in
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <div className="lp-footer-mark">L</div>
            <span className="lp-footer-name">LINURI</span>
          </div>
          <div className="lp-footer-meta">
            Literacy and Numeracy Readiness Indicator<br />
            United Methodist Cooperative Learning System, Inc. · Caloocan City<br />
            Immaculada Concepcion College of Soldiers Hills
          </div>
        </footer>

      </div>
    </>
  )
}