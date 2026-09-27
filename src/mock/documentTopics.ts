/**
 * src/mock/documentTopics.ts — Phase 4: Document Topics Catalog.
 */

export interface DocumentTopic {
  id: string;
  documentId: string;
  name: string;
  description: string;
  questionCount: number;
}

export const mockDocumentTopics: DocumentTopic[] = [
  {
    id: 'processes',
    documentId: 'doc-001',
    name: 'Processes',
    description: 'Process control blocks (PCB), process states, fork/exec lifecycle, context switching overhead.',
    questionCount: 15,
  },
  {
    id: 'threads',
    documentId: 'doc-001',
    name: 'Threads',
    description: 'User-level vs kernel-level threads, POSIX pthreads, shared vs private memory spaces.',
    questionCount: 15,
  },
  {
    id: 'scheduling',
    documentId: 'doc-001',
    name: 'Scheduling',
    description: 'Preemptive vs non-preemptive algorithms (FCFS, SJF, Round Robin, Multilevel Feedback Queues).',
    questionCount: 15,
  },
  {
    id: 'synchronization',
    documentId: 'doc-001',
    name: 'Synchronization',
    description: 'Critical sections, Peterson algorithm, mutexes, semaphores, deadlock conditions.',
    questionCount: 15,
  },
  {
    id: 'memory',
    documentId: 'doc-001',
    name: 'Memory',
    description: 'Virtual memory address translation, paging, page tables, TLB, page replacement algorithms.',
    questionCount: 15,
  },
];
