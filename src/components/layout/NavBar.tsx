import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export function NavBar() {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand" aria-label="Adaptive home">
          ADAPTIVE
        </NavLink>

        <ul className="nav-links">
          <li>
            <NavLink
              to="/assess"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              Assess
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/skills"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              Profile
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/report"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              Reports
            </NavLink>
          </li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <NavLink to="/assess">
            <motion.button
              className="btn btn-primary btn-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Start a new assessment"
            >
              Start Assessment →
            </motion.button>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
