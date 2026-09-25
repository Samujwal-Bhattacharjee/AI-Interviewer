import { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  sub?: string;
  type: 'start' | 'question' | 'state' | 'end';
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const nodes: Node[] = [
  { id: 'start', x: 50, y: 20, label: 'START', type: 'start' },
  { id: 'q1', x: 50, y: 80, label: 'Q01', sub: 'FOUNDATIONAL', type: 'question' },
  { id: 'q2a', x: 20, y: 160, label: 'Q02', sub: 'EASY', type: 'question' },
  { id: 'q2b', x: 80, y: 160, label: 'Q02', sub: 'MEDIUM', type: 'question' },
  { id: 'q3a', x: 10, y: 240, label: 'Q03', sub: 'EASY', type: 'question' },
  { id: 'q3b', x: 50, y: 240, label: 'Q03', sub: 'HARD', type: 'question' },
  { id: 'q3c', x: 80, y: 240, label: 'Q03', sub: 'PROBE', type: 'state' },
  { id: 'boundary', x: 50, y: 330, label: 'BOUNDARY', sub: 'LOCATED', type: 'end' },
];

const edges: Edge[] = [
  { from: 'start', to: 'q1' },
  { from: 'q1', to: 'q2a', label: 'struggles' },
  { from: 'q1', to: 'q2b', label: 'performs well' },
  { from: 'q2a', to: 'q3a' },
  { from: 'q2b', to: 'q3b' },
  { from: 'q2b', to: 'q3c', label: 'incomplete' },
  { from: 'q3a', to: 'boundary' },
  { from: 'q3b', to: 'boundary' },
  { from: 'q3c', to: 'boundary' },
];

const WIDTH = 360;
const HEIGHT = 400;

function toSVG(x: number, y: number) {
  return { svgX: (x / 100) * WIDTH, svgY: (y / 100) * HEIGHT };
}

export function AdaptivePathDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const nodeMap: Record<string, { svgX: number; svgY: number } & Node> = {};
  nodes.forEach((n) => {
    const { svgX, svgY } = toSVG(n.x, n.y);
    nodeMap[n.id] = { ...n, svgX, svgY };
  });

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height="100%"
      style={{ maxWidth: WIDTH, overflow: 'visible' }}
      aria-label="Adaptive assessment path diagram showing branching question selection"
      role="img"
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-mid-2)" />
        </marker>
      </defs>

      {/* Edges */}
      {isInView && edges.map((edge, i) => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];
        if (!from || !to) return null;
        const midX = (from.svgX + to.svgX) / 2;
        const midY = (from.svgY + to.svgY) / 2;

        return (
          <g key={`${edge.from}-${edge.to}`}>
            <motion.line
              x1={from.svgX}
              y1={from.svgY + 10}
              x2={to.svgX}
              y2={to.svgY - 10}
              stroke="var(--c-rule)"
              strokeWidth="1"
              markerEnd="url(#arrow)"
              strokeDasharray="200"
              initial={{ strokeDashoffset: 200 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeInOut' }}
            />
            {edge.label && (
              <motion.text
                x={midX + (from.svgX > to.svgX ? -8 : from.svgX < to.svgX ? 8 : 0)}
                y={midY}
                fill="var(--c-mid-2)"
                fontSize="7"
                fontFamily="var(--f-mono)"
                letterSpacing="0.06em"
                textAnchor="middle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.12 + 0.4 }}
              >
                {edge.label}
              </motion.text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {isInView && nodes.map((node, i) => {
        const { svgX, svgY } = nodeMap[node.id];
        const isEnd = node.type === 'end';
        const isStart = node.type === 'start';

        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {isEnd ? (
              <rect
                x={svgX - 30}
                y={svgY - 10}
                width="60"
                height="20"
                fill="var(--c-ink)"
                rx="0"
              />
            ) : isStart ? (
              <circle cx={svgX} cy={svgY} r="8" fill="var(--c-accent)" />
            ) : (
              <rect
                x={svgX - 20}
                y={svgY - 10}
                width="40"
                height="20"
                fill="var(--c-surface)"
                stroke={node.type === 'state' ? 'var(--c-accent)' : 'var(--c-rule)'}
                strokeWidth="1"
                rx="0"
              />
            )}

            <text
              x={svgX}
              y={svgY + (isEnd ? 4 : 3)}
              fill={isEnd ? 'var(--c-paper)' : isStart ? 'transparent' : 'var(--c-ink)'}
              fontSize="7"
              fontFamily="var(--f-mono)"
              fontWeight="500"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              {node.label}
            </text>

            {node.sub && !isEnd && (
              <text
                x={svgX}
                y={svgY + 18}
                fill={node.type === 'state' ? 'var(--c-accent)' : 'var(--c-mid)'}
                fontSize="6"
                fontFamily="var(--f-mono)"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                {node.sub}
              </text>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
