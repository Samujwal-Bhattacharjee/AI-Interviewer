import { motion } from 'framer-motion';

export function AdaptivePathDiagram() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg
        viewBox="0 0 400 240"
        style={{ width: '100%', height: '220px', overflow: 'visible' }}
        aria-label="Adaptive assessment item response theory graph"
      >
        <defs>
          <marker id="dot-blue" markerWidth="6" markerHeight="6" refX="3" refY="3">
            <circle cx="3" cy="3" r="2.5" fill="#0047FF" />
          </marker>
        </defs>

        {/* Lines */}
        {/* Root to 01 */}
        <motion.line
          x1="200"
          y1="20"
          x2="200"
          y2="70"
          stroke="#000000"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* 01 to left node */}
        <motion.line
          x1="180"
          y1="82"
          x2="90"
          y2="140"
          stroke="#999999"
          strokeWidth="1"
          strokeDasharray="3 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <text
          x="125"
          y="105"
          fontSize="8"
          fontFamily="var(--f-mono)"
          fill="#888888"
          letterSpacing="0.05em"
        >
          -1.2σ LOW
        </text>

        {/* 01 to right active node (sys) */}
        <motion.line
          x1="220"
          y1="82"
          x2="300"
          y2="140"
          stroke="#000000"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        <text
          x="270"
          y="105"
          fontSize="8"
          fontFamily="var(--f-mono)"
          fill="#000000"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          +0.8σ OPTIMAL
        </text>

        {/* sys to 09 EST */}
        <motion.line
          x1="310"
          y1="152"
          x2="350"
          y2="195"
          stroke="#0047FF"
          strokeWidth="1"
          strokeDasharray="2 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        />
        <text
          x="355"
          y="178"
          fontSize="7"
          fontFamily="var(--f-mono)"
          fill="#0047FF"
          letterSpacing="0.05em"
        >
          CONVERGE
        </text>

        {/* Nodes */}
        {/* Root Node: Solid Blue Square */}
        <motion.rect
          x="195"
          y="12"
          width="10"
          height="10"
          fill="#0047FF"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Node 01: White box with black border */}
        <motion.g
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <rect
            x="175"
            y="70"
            width="50"
            height="24"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1.2"
          />
          <text
            x="200"
            y="85"
            fontSize="10"
            fontFamily="var(--f-mono)"
            fontWeight="600"
            fill="#000000"
            textAnchor="middle"
          >
            ...01...
          </text>
        </motion.g>

        {/* Node Left: 02 */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <rect
            x="65"
            y="130"
            width="46"
            height="22"
            fill="#FFFFFF"
            stroke="#CCCCCC"
            strokeWidth="1"
          />
          <text
            x="88"
            y="144"
            fontSize="9"
            fontFamily="var(--f-mono)"
            fill="#666666"
            textAnchor="middle"
          >
            02
          </text>
        </motion.g>

        {/* Node Right: sys (Active Solid Black Box) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <rect
            x="270"
            y="130"
            width="60"
            height="24"
            fill="#000000"
            stroke="#000000"
            strokeWidth="1"
          />
          <text
            x="300"
            y="145"
            fontSize="10"
            fontFamily="var(--f-mono)"
            fontWeight="700"
            fill="#FFFFFF"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            sys
          </text>
          {/* Active target pulse beacon */}
          <circle cx="330" cy="130" r="3" fill="#0047FF" />
        </motion.g>

        {/* Node Deep: 09 EST */}
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <rect
            x="330"
            y="185"
            width="55"
            height="22"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="1"
          />
          <text
            x="357"
            y="199"
            fontSize="8"
            fontFamily="var(--f-mono)"
            fontWeight="600"
            fill="#000000"
            textAnchor="middle"
            letterSpacing="0.05em"
          >
            09 EST
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
