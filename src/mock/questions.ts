import type { InterviewQuestion } from '../types/assessment';

export const mockQuestions: InterviewQuestion[] = [
  {
    id: 'q-001',
    competencyId: 'comp-dsa',
    difficulty: 'medium',
    questionType: 'conceptual',
    question: 'Why does a hash table have average O(1) lookup time? Walk me through what happens when you look up a key.',
    expectedConcepts: ['hashing', 'bucket mapping', 'collision handling', 'average complexity', 'worst-case complexity'],
    followUpPrompts: [
      'What happens in the worst case, and when does that occur?',
      'How does load factor affect performance?',
    ],
  },
  {
    id: 'q-002',
    competencyId: 'comp-dsa',
    difficulty: 'hard',
    questionType: 'analytical',
    question: 'Explain the difference between depth-first and breadth-first search. When would you choose one over the other?',
    expectedConcepts: ['DFS traversal order', 'BFS traversal order', 'stack vs queue', 'shortest path', 'memory complexity', 'graph properties'],
    followUpPrompts: [
      'How would the choice change if the graph has cycles?',
      'What if you needed to find the shortest path between two nodes?',
    ],
  },
  {
    id: 'q-003',
    competencyId: 'comp-debugging',
    difficulty: 'medium',
    questionType: 'applied',
    question: 'A function that should return a sorted list is returning incorrect results intermittently. Describe your debugging process.',
    expectedConcepts: ['reproduce the issue', 'isolate the condition', 'state inspection', 'edge cases', 'race conditions', 'systematic narrowing'],
    followUpPrompts: [
      'What if it only fails in production but not locally?',
      'How would you approach it if you cannot reproduce it consistently?',
    ],
  },
  {
    id: 'q-004',
    competencyId: 'comp-python',
    difficulty: 'medium',
    questionType: 'conceptual',
    question: 'Explain Python\'s Global Interpreter Lock. What problems does it cause, and what are the common workarounds?',
    expectedConcepts: ['GIL definition', 'thread safety', 'CPU-bound limitation', 'multiprocessing', 'async IO', 'C extensions'],
    followUpPrompts: [
      'When is the GIL actually not a problem?',
      'How does asyncio differ from multiprocessing as a workaround?',
    ],
  },
  {
    id: 'q-005',
    competencyId: 'comp-debugging',
    difficulty: 'hard',
    questionType: 'applied',
    question: 'You have a service that works correctly under low load but fails unpredictably under high concurrency. How do you approach diagnosing and resolving this?',
    expectedConcepts: ['race conditions', 'shared state', 'locking mechanisms', 'load testing', 'profiling', 'deadlocks', 'thread safety'],
    followUpPrompts: [
      'What tools would you use to reproduce and measure the problem?',
      'Walk me through how you would identify if it is a deadlock vs a race condition.',
    ],
  },
  {
    id: 'q-006',
    competencyId: 'comp-system-design',
    difficulty: 'medium',
    questionType: 'analytical',
    question: 'Design a URL shortening service. What are the key components and how do they interact?',
    expectedConcepts: ['hash function', 'database schema', 'redirection', 'scalability', 'collision handling', 'analytics'],
    followUpPrompts: [
      'How would you handle 1 billion shortened URLs?',
      'What if you needed to support custom aliases?',
    ],
  },
  {
    id: 'q-007',
    competencyId: 'comp-dsa',
    difficulty: 'foundational',
    questionType: 'conceptual',
    question: 'What is the difference between an array and a linked list? When would you choose each?',
    expectedConcepts: ['contiguous memory', 'pointer-based', 'access time', 'insertion time', 'cache locality', 'use cases'],
    followUpPrompts: [
      'What are the cache implications of linked lists?',
      'How does a doubly linked list differ, and when is that useful?',
    ],
  },
  {
    id: 'q-008',
    competencyId: 'comp-sql',
    difficulty: 'medium',
    questionType: 'applied',
    question: 'Write a query to find the second highest salary from an employees table. Explain why your approach handles edge cases.',
    expectedConcepts: ['subquery', 'ORDER BY', 'LIMIT/OFFSET', 'NULL handling', 'DISTINCT', 'ties'],
    followUpPrompts: [
      'How would you modify this to find the Nth highest salary?',
      'What if multiple employees have the same salary?',
    ],
  },
];
