import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green:       #1a7a40;
          --green-dark:  #0d3d20;
          --green-light: #eaf6ef;
          --gold-lt:     #ffd166;
          --cream:       #fdfaf5;
          --white:       #ffffff;
          --text:        #1a1f16;
          --muted:       #6b7280;
          --border:      rgba(26,122,64,0.13);
          --font:        'Plus Jakarta Sans', sans-serif;
        }

        .unauth-page {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: var(--font);
          padding: 2rem 1.25rem;
          position: relative;
          overflow: hidden;
        }
        .unauth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(26,122,64,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .unauth-card {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          box-shadow: 0 4px 32px rgba(13,61,32,0.08), 0 1px 4px rgba(13,61,32,0.04);
          padding: 3rem 2.25rem 2.5rem;
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .unauth-icon {
          width: 64px;
          height: 64px;
          background: #fff0f0;
          border: 1.5px solid rgba(139,26,26,0.15);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin: 0 auto 1.5rem;
        }

        .unauth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-bottom: 2rem;
        }
        .unauth-mark {
          width: 36px;
          height: 36px;
          background: var(--green-dark);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--gold-lt);
          flex-shrink: 0;
        }
        .unauth-mark-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--green-dark);
          letter-spacing: 0.01em;
        }

        .unauth-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #8b1a1a;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }
        .unauth-desc {
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .unauth-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--green-dark);
          color: #fff;
          padding: 0.7rem 1.5rem;
          border-radius: 9px;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: var(--font);
          text-decoration: none;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: -0.01em;
        }
        .unauth-btn:hover { background: var(--green); transform: translateY(-1px); }

        .unauth-school {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.72rem;
          color: var(--muted);
          opacity: 0.7;
          line-height: 1.8;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="unauth-page">
        <div className="unauth-card">
          <div className="unauth-logo">
            <div className="unauth-mark">L</div>
            <span className="unauth-mark-name">LINURI</span>
          </div>

          <div className="unauth-icon">🚫</div>

          <h1 className="unauth-title">Access Denied</h1>
          <p className="unauth-desc">
            You don&apos;t have permission to view that page.
            <br />
            Please sign in with the correct account.
          </p>

          <Link href="/login" className="unauth-btn">
            ← Back to login
          </Link>
        </div>

        <p className="unauth-school">
          United Methodist Cooperative Learning System, Inc.
          <br />
          Caloocan City · Adaptive Learning Platform
        </p>
      </div>
    </>
  );
}
