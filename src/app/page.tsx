// src/app/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:      #1b5e30;
          --green-dark: #0d3a1b;
          --green-mid:  #154d26;
          --crimson:    #8b1a1a;
          --gold:       #c9941a;
          --gold-lt:    #e8b84b;
          --cream:      #faf6ee;
          --cream2:     #f0e9d8;
          --white:      #ffffff;
          --text:       #1a1a1a;
          --text-soft:  #6b6b6b;
        }

        .landing {
          font-family: 'Outfit', sans-serif;
          background: var(--cream);
          color: var(--text);
          min-height: 100vh;
        }

        /* ── NAV ── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--green-dark);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          height: 64px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .nav-logo-box {
          width: 36px;
          height: 36px;
          background: var(--gold);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: var(--green-dark);
          font-weight: 700;
          flex-shrink: 0;
        }
        .nav-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: var(--white);
          letter-spacing: 0.02em;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .btn-nav-outline {
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 6px;
          padding: 0.45rem 1.1rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .btn-nav-outline:hover { background: rgba(255,255,255,0.08); color: white; }
        .btn-nav-primary {
          background: var(--gold);
          color: var(--green-dark);
          border: none;
          border-radius: 6px;
          padding: 0.45rem 1.25rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-nav-primary:hover { opacity: 0.88; }

        /* ── HERO ── */
        .hero {
          background: var(--green-dark);
          position: relative;
          overflow: hidden;
          padding: 6rem 3rem 5rem;
          text-align: center;
        }
        .hero::before {
          content: 'LINURI';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-family: 'DM Serif Display', serif;
          font-size: 22vw;
          color: rgba(255,255,255,0.025);
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          line-height: 1;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(201,148,26,0.15);
          border: 1px solid rgba(201,148,26,0.3);
          color: var(--gold-lt);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.35rem 1rem;
          border-radius: 99px;
          margin-bottom: 1.75rem;
        }
        .hero-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
          display: inline-block;
        }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.6rem, 6vw, 4.2rem);
          color: var(--white);
          line-height: 1.1;
          max-width: 760px;
          margin: 0 auto 1.25rem;
        }
        .hero h1 em {
          font-style: italic;
          color: var(--gold-lt);
        }
        .hero-sub {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.55);
          font-weight: 300;
          max-width: 520px;
          margin: 0 auto 2.5rem;
          line-height: 1.65;
        }
        .hero-btns {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 3.5rem;
        }
        .btn-hero-primary {
          background: var(--gold);
          color: var(--green-dark);
          border: none;
          border-radius: 8px;
          padding: 0.875rem 2rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .btn-hero-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-hero-outline {
          background: transparent;
          color: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(255,255,255,0.25);
          border-radius: 8px;
          padding: 0.875rem 2rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .btn-hero-outline:hover { background: rgba(255,255,255,0.08); color: white; }

        /* Hero badges */
        .hero-badges {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .hero-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255,255,255,0.45);
          font-size: 0.8rem;
          font-weight: 400;
        }
        .hero-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        /* ── SCHOOL STRIP ── */
        .school-strip {
          background: var(--cream2);
          border-top: 1px solid rgba(27,94,48,0.12);
          border-bottom: 1px solid rgba(27,94,48,0.12);
          padding: 1.25rem 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          text-align: center;
        }
        .school-strip-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-soft);
        }
        .school-strip-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1rem;
          color: var(--green-dark);
        }
        .school-strip-divider {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        /* ── SECTIONS ── */
        .section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }
        .section-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.6rem;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.7rem, 3.5vw, 2.4rem);
          color: var(--green-dark);
          line-height: 1.15;
          margin-bottom: 1rem;
        }
        .section-desc {
          color: var(--text-soft);
          font-size: 0.975rem;
          line-height: 1.7;
          max-width: 540px;
          margin-bottom: 3rem;
        }

        /* ── FEATURE CARDS ── */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .feature-card {
          background: var(--white);
          border: 1px solid rgba(27,94,48,0.1);
          border-radius: 12px;
          padding: 1.5rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.2s, transform 0.15s;
        }
        .feature-card:hover { border-color: rgba(27,94,48,0.3); transform: translateY(-2px); }
        .feature-icon {
          width: 40px; height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .feature-icon.green  { background: #e8f5ed; }
        .feature-icon.gold   { background: #fdf8ee; }
        .feature-icon.crimson{ background: #fdf0f0; }
        .feature-card h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: var(--green-dark);
        }
        .feature-card p {
          font-size: 0.875rem;
          color: var(--text-soft);
          line-height: 1.65;
        }

        /* ── HOW IT WORKS ── */
        .how-bg {
          background: var(--green-dark);
          position: relative;
          overflow: hidden;
        }
        .how-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.012) 40px,
            rgba(255,255,255,0.012) 41px
          );
          pointer-events: none;
        }
        .how-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }
        .how-section .section-label { color: var(--gold-lt); }
        .how-section .section-title { color: var(--white); }
        .how-section .section-desc  { color: rgba(255,255,255,0.5); }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
        }
        .step-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .step-num {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--gold-lt);
          letter-spacing: 0.1em;
          font-weight: 500;
        }
        .step-card h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.05rem;
          color: var(--white);
        }
        .step-card p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.48);
          line-height: 1.6;
        }

        /* ── ROLES ── */
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .role-card {
          background: var(--white);
          border: 1px solid rgba(27,94,48,0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .role-card-header {
          padding: 1.25rem 1.5rem 1rem;
          border-bottom: 1px solid rgba(27,94,48,0.08);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .role-avatar {
          width: 38px; height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 1rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .role-avatar.student { background: #e8f5ed; color: #0d3a1b; }
        .role-avatar.teacher { background: #fdf8ee; color: #7a5a00; }
        .role-avatar.admin   { background: #fdf0f0; color: #8b1a1a; }
        .role-card-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--green-dark);
        }
        .role-card-tag {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-soft);
          margin-top: 1px;
        }
        .role-card-body {
          padding: 1rem 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .role-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.83rem;
          color: var(--text-soft);
          line-height: 1.4;
        }
        .role-bullet {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          margin-top: 5px;
        }

        /* ── MASTERY LEVELS ── */
        .mastery-strip {
          background: var(--cream2);
          border-top: 1px solid rgba(27,94,48,0.1);
          border-bottom: 1px solid rgba(27,94,48,0.1);
        }
        .mastery-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }
        .mastery-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
          margin-top: 2.5rem;
        }
        .mastery-card {
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .mastery-card.needs-help { background: #fdf0f0; border: 1.5px solid rgba(139,26,26,0.2); }
        .mastery-card.developing { background: #fdf8ee; border: 1.5px solid rgba(201,148,26,0.25); }
        .mastery-card.mastered   { background: #f0f7f2; border: 1.5px solid rgba(27,94,48,0.2); }
        .mastery-card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1rem;
        }
        .mastery-card.needs-help .mastery-card-title { color: #8b1a1a; }
        .mastery-card.developing .mastery-card-title { color: #7a5a00; }
        .mastery-card.mastered   .mastery-card-title { color: #0d3a1b; }
        .mastery-card p {
          font-size: 0.82rem;
          color: var(--text-soft);
          line-height: 1.55;
        }

        /* ── CTA ── */
        .cta-section {
          background: var(--green-dark);
          text-align: center;
          padding: 6rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .cta-section::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 60% at 50% 100%, rgba(201,148,26,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-section h2 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          color: var(--white);
          max-width: 600px;
          margin: 0 auto 1rem;
          line-height: 1.15;
        }
        .cta-section p {
          color: rgba(255,255,255,0.5);
          font-size: 0.975rem;
          margin-bottom: 2.5rem;
          max-width: 460px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.65;
        }
        .cta-btns {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        .footer {
          background: #060f08;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 2.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .footer-logo {
          width: 28px; height: 28px;
          background: var(--gold);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 0.85rem;
          color: var(--green-dark);
          font-weight: 700;
          flex-shrink: 0;
        }
        .footer-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1rem;
          color: rgba(255,255,255,0.6);
        }
        .footer-meta {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
          text-align: right;
          line-height: 1.7;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .nav { padding: 0 1.25rem; }
          .hero { padding: 4rem 1.25rem 3.5rem; }
          .school-strip { padding: 1rem 1.25rem; }
          .section { padding: 3.5rem 1.25rem; }
          .how-section { padding: 3.5rem 1.25rem; }
          .footer { padding: 2rem 1.25rem; flex-direction: column; align-items: flex-start; }
          .footer-meta { text-align: left; }
        }
      `}</style>

      <div className="landing">

        {/* ── NAV ── */}
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo-box">L</div>
            <span className="nav-name">LINURI</span>
          </div>
          <div className="nav-actions">
            <button className="btn-nav-outline" onClick={() => router.push('/login')}>
              Log in
            </button>
            <button className="btn-nav-primary" onClick={() => router.push('/register')}>
              Get Started
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            AI-Integrated Adaptive Learning System
          </div>
          <h1>
            Every student learns at their <em>own pace.</em>
          </h1>
          <p className="hero-sub">
            LINURI tracks mastery in English, Mathematics, and Science for Grade 6 students — then adapts the difficulty so no one is left behind.
          </p>
          <div className="hero-btns">
            <button className="btn-hero-primary" onClick={() => router.push('/register')}>
              Start Learning Free
            </button>
            <button className="btn-hero-outline" onClick={() => router.push('/login')}>
              I already have an account
            </button>
          </div>
          <div className="hero-badges">
            {[
              'Grade 6 Curriculum',
              'Real-Time Mastery Tracking',
              'Gemini AI-Powered Hints',
              'Caloocan City',
            ].map(b => (
              <span key={b} className="hero-badge">
                <span className="hero-badge-dot" />
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* ── SCHOOL STRIP ── */}
        <div className="school-strip">
          <span className="school-strip-label">Developed for</span>
          <span className="school-strip-divider" />
          <span className="school-strip-name">
            United Methodist Cooperative Learning System, Inc.
          </span>
          <span className="school-strip-divider" />
          <span className="school-strip-label">Caloocan City </span>
        </div>

        {/* ── FEATURES ── */}
        <div className="section">
          <div className="section-label">What LINURI Does</div>
          <h2 className="section-title">Smarter learning,<br />powered by AI</h2>
          <p className="section-desc">
            LINURI combines a decision-tree classifier with Google Gemini to give every student a personalized learning path — automatically.
          </p>
          <div className="feature-grid">
            {[
              {
                icon: '🎯', color: 'green',
                title: 'Adaptive Difficulty',
                desc: 'After every quiz, LINURI adjusts the difficulty level — Basic, Standard, or Advanced — based on the student\'s mastery score.',
              },
              {
                icon: '💡', color: 'gold',
                title: 'AI-Generated Hints',
                desc: 'When a student is stuck, Gemini AI generates a context-aware hint for the question — no generic answers.',
              },
              {
                icon: '📊', color: 'green',
                title: 'Mastery Tracking',
                desc: 'Every quiz attempt is saved. Teachers and admins can see which students are Mastered, Developing, or Needs Help at a glance.',
              },
              {
                icon: '🚩', color: 'crimson',
                title: 'Regression Alerts',
                desc: 'Students who regress two or more times on a skill are automatically flagged so teachers can intervene early.',
              },
              {
                icon: '📝', color: 'gold',
                title: 'Teacher Lesson Builder',
                desc: 'Teachers input a lesson topic and LINURI auto-generates multiple-choice questions using Gemini — ready for review and publish.',
              },
              {
                icon: '🏫', color: 'green',
                title: 'Class Management',
                desc: 'Create class sections with auto-generated join codes. Students enrol instantly — no manual setup needed.',
              },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="how-bg">
          <div className="how-section">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">From lesson to mastery<br />in four steps</h2>
            <p className="section-desc">
              The adaptive loop keeps running until every student reaches mastery.
            </p>
            <div className="steps-grid">
              {[
                { n: '01', title: 'Teacher creates a lesson', desc: 'Enter a topic, subject, and difficulty. Gemini generates 10 multiple-choice questions automatically.' },
                { n: '02', title: 'Student takes the quiz', desc: 'Each question has a 60-second timer. Hints are available when time runs out or when the student asks.' },
                { n: '03', title: 'Classifier scores mastery', desc: 'The decision-tree classifier analyses accuracy and assigns a mastery level: Needs Help, Developing, or Mastered.' },
                { n: '04', title: 'Adaptive router recommends next step', desc: 'Based on mastery, the system routes the student to the right difficulty level for the next quiz.' },
              ].map(step => (
                <div key={step.n} className="step-card">
                  <div className="step-num">STEP {step.n}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROLES ── */}
        <div className="section">
          <div className="section-label">User Roles</div>
          <h2 className="section-title">Built for everyone<br />in the classroom</h2>
          <p className="section-desc">
            LINURI has three distinct roles, each with their own dashboard and tools.
          </p>
          <div className="roles-grid">
            {[
              {
                role: 'student', initial: 'S', tag: 'Self-register',
                name: 'Student',
                items: [
                  'Take adaptive quizzes in English, Math, and Science',
                  'Get AI-powered hints when stuck',
                  'Track personal mastery progress over time',
                  'Enrol in class with a join code',
                ],
              },
              {
                role: 'teacher', initial: 'T', tag: 'Self-register',
                name: 'Teacher',
                items: [
                  'Create class sections with join codes',
                  'Generate lessons and questions via Gemini AI',
                  'Review and approve questions before publishing',
                  'Monitor class mastery and flagged students',
                ],
              },
              {
                role: 'admin', initial: 'A', tag: 'Manually created',
                name: 'Admin',
                items: [
                  'View all users, classes, and mastery records',
                  'Access school-wide mastery report by subject',
                  'Print reports directly from the dashboard',
                  'Oversee the entire LINURI system',
                ],
              },
            ].map(r => (
              <div key={r.role} className="role-card">
                <div className="role-card-header">
                  <div className={`role-avatar ${r.role}`}>{r.initial}</div>
                  <div>
                    <div className="role-card-name">{r.name}</div>
                    <div className="role-card-tag">{r.tag}</div>
                  </div>
                </div>
                <div className="role-card-body">
                  {r.items.map(item => (
                    <div key={item} className="role-item">
                      <span className="role-bullet" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MASTERY LEVELS ── */}
        <div className="mastery-strip">
          <div className="mastery-section">
            <div className="section-label">Mastery Framework</div>
            <h2 className="section-title">Three levels. One goal: Mastery.</h2>
            <div className="mastery-cards">
              {[
                {
                  cls: 'needs-help',
                  title: '▲ Needs Help',
                  desc: 'The student scored below the threshold. LINURI steps down to Basic difficulty and encourages re-attempt with hints enabled.',
                },
                {
                  cls: 'developing',
                  title: '◆ Developing',
                  desc: 'The student is on track but not yet consistent. LINURI keeps difficulty at Standard and monitors for regression.',
                },
                {
                  cls: 'mastered',
                  title: '★ Mastered',
                  desc: 'The student has demonstrated consistent accuracy. LINURI advances them to Advanced difficulty for continued growth.',
                },
              ].map(m => (
                <div key={m.cls} className={`mastery-card ${m.cls}`}>
                  <div className="mastery-card-title">{m.title}</div>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="cta-section">
          <h2>Ready to start your<br />adaptive learning journey?</h2>
          <p>
            Join the students and teachers of United Methodist Cooperative Learning System, Inc. already using LINURI.
          </p>
          <div className="cta-btns">
            <button className="btn-hero-primary" onClick={() => router.push('/register')}>
              Create an Account
            </button>
            <button className="btn-hero-outline" onClick={() => router.push('/login')}>
              Log in
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-brand">
            <div className="footer-logo">L</div>
            <span className="footer-name">LINURI</span>
          </div>
          <div className="footer-meta">
            Literacy and Numeracy Readiness Indicator<br />
            United Methodist Cooperative Learning System, Inc. · Caloocan City<br />
             · Immaculada Concepcion College of Soldiers Hills
          </div>
        </footer>

      </div>
    </>
  )
}