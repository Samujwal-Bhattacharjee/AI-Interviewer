import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export function NavBar() {
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid #000000',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontFamily: 'var(--f-mono)',
        fontSize: '11px',
      }}
    >
      {/* Left: Brand + Telemetry Flag */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#000000',
            paddingRight: '20px',
            borderRight: '1px solid #000000',
            height: '100%',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--f-sans)',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '0.04em',
              color: '#000000',
            }}
          >
            ADAPTIVE
          </span>
          <span
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: '#666666',
              fontWeight: 500,
            }}
          >
            [sys.v0.1]
          </span>
        </Link>

        {/* Engine status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 20px',
            color: '#555555',
            letterSpacing: '0.12em',
            fontSize: '10px',
            height: '100%',
            borderRight: '1px solid #E5E7EB',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#0047FF',
              boxShadow: '0 0 8px rgba(0, 71, 255, 0.6)',
              animation: 'pulseDot 2s infinite ease-in-out',
            }}
          />
          <span>IN_IF // VOICE_ENGINE_ACTV</span>
        </div>
      </div>

      {/* Center / Nav Items */}
      <nav style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <NavLink
          to="/assess"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            height: '100%',
            textDecoration: 'none',
            color: isActive ? '#0047FF' : '#000000',
            fontWeight: 600,
            letterSpacing: '0.14em',
            borderRight: '1px solid #E5E7EB',
            transition: 'color 0.15s ease',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: '#0047FF',
                  }}
                />
              )}
              ASSESS
            </>
          )}
        </NavLink>

        <NavLink
          to="/skills"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            height: '100%',
            textDecoration: 'none',
            color: isActive ? '#0047FF' : '#000000',
            fontWeight: 600,
            letterSpacing: '0.14em',
            borderRight: '1px solid #E5E7EB',
            transition: 'color 0.15s ease',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: '#0047FF',
                  }}
                />
              )}
              PROFILE
            </>
          )}
        </NavLink>

        <NavLink
          to="/report"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            height: '100%',
            textDecoration: 'none',
            color: isActive ? '#0047FF' : '#000000',
            fontWeight: 600,
            letterSpacing: '0.14em',
            borderRight: '1px solid #E5E7EB',
            transition: 'color 0.15s ease',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    background: '#0047FF',
                  }}
                />
              )}
              REPORTS
            </>
          )}
        </NavLink>

        <Link
          to="/skills"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 20px',
            height: '100%',
            textDecoration: 'none',
            color: '#000000',
            fontWeight: 600,
            letterSpacing: '0.14em',
            borderRight: '1px solid #000000',
            transition: 'color 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#0047FF')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#000000')}
        >
          TELEMETRY
        </Link>
      </nav>

      {/* Right: Sync Status & Primary Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '16px' }}>
        {/* UTC Clock & Sync Status */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1px',
            paddingRight: '12px',
          }}
        >
          <span style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.14em' }}>
            SYNC STATUS: <strong style={{ color: '#000000' }}>OK</strong>
          </span>
          <span style={{ fontSize: '10px', color: '#000000', fontWeight: 600, letterSpacing: '0.08em' }}>
            {utcTime || '18:40:19 UTC'}
          </span>
        </div>

        {/* Start Assessment Button */}
        <button
          onClick={() => navigate('/assess')}
          style={{
            background: '#000000',
            color: '#FFFFFF',
            border: '1px solid #000000',
            borderRadius: 0,
            padding: '8px 18px',
            fontFamily: 'var(--f-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.color = '#000000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#000000';
            e.currentTarget.style.color = '#FFFFFF';
          }}
        >
          START ASSESSMENT ▾
        </button>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </header>
  );
}
