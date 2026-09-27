/**
 * src/services/documentService.ts — Phase 4: Document Processing Architecture.
 * Provides DocumentProcessingService interface and MockDocumentProcessingService.
 * Follows future AI document pipeline abstraction:
 *   PDF/PPT -> Text extraction -> Chunking -> Topic extraction -> Concept extraction -> Question generation.
 */

import { delay } from '../lib/api';
import { mockDocuments, type DocumentProfile } from '../mock/documents';
import { mockDocumentTopics, type DocumentTopic } from '../mock/documentTopics';
import { mockDocumentQuestions, type DocumentQuestionItem } from '../mock/documentQuestions';

export interface DocumentUploadResult {
  documentId: string;
  fileName: string;
  fileSize: string;
  pages: number;
}

export interface ExtractedTopicResult {
  id: string;
  name: string;
  confidence: number;
  questionCount: number;
}

export interface DocumentQuestionFilter {
  documentId: string;
  selectedTopicIds: string[];
  difficulty?: 'foundational' | 'easy' | 'medium' | 'hard';
  count?: number;
}

export interface DocumentProcessingService {
  upload(file: { name: string; size: number; type: string }): Promise<DocumentUploadResult>;
  extract(documentId: string): Promise<{ textExtracted: boolean; pageCount: number }>;
  detectTopics(documentId: string): Promise<ExtractedTopicResult[]>;
  getQuestionSet(filter: DocumentQuestionFilter): Promise<DocumentQuestionItem[]>;
  getAllDocuments(): Promise<DocumentProfile[]>;
  getDocumentById(documentId: string): Promise<DocumentProfile | null>;
  getAllTopics(documentId?: string): Promise<DocumentTopic[]>;
}

export class MockDocumentProcessingService implements DocumentProcessingService {
  private documents: DocumentProfile[] = [...mockDocuments];

  async upload(file: { name: string; size: number; type: string }): Promise<DocumentUploadResult> {
    await delay(500);
    const docId = `doc-${Date.now()}`;
    const newDoc: DocumentProfile = {
      id: docId,
      title: file.name,
      fileName: file.name,
      fileType: file.name.endsWith('.pptx') ? 'pptx' : file.name.endsWith('.ppt') ? 'ppt' : 'pdf',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      pages: 42,
      uploadedAt: new Date().toISOString(),
      status: 'indexed',
      sourceStatus: 'READY',
      questionSourceType: 'DOCUMENT + TOPICS',
      topicsDetected: ['Processes', 'Threads', 'Scheduling', 'Memory', 'Synchronization'],
      topicSummaries: [
        { id: 'processes', name: 'Processes', questionCount: 15, confidence: 0.98 },
        { id: 'threads', name: 'Threads', questionCount: 15, confidence: 0.96 },
        { id: 'scheduling', name: 'Scheduling', questionCount: 15, confidence: 0.94 },
        { id: 'memory', name: 'Memory', questionCount: 15, confidence: 0.91 },
        { id: 'synchronization', name: 'Synchronization', questionCount: 15, confidence: 0.95 },
      ],
      uploadedBy: 'faculty-001',
      summary: `Extracted course syllabus and core architectural content from ${file.name}.`,
    };
    this.documents.unshift(newDoc);

    return {
      documentId: docId,
      fileName: file.name,
      fileSize: newDoc.fileSize,
      pages: 42,
    };
  }

  async extract(_documentId: string): Promise<{ textExtracted: boolean; pageCount: number }> {
    await delay(400);
    return { textExtracted: true, pageCount: 42 };
  }

  async detectTopics(_documentId: string): Promise<ExtractedTopicResult[]> {
    await delay(450);
    return [
      { id: 'processes', name: 'Processes', confidence: 0.98, questionCount: 15 },
      { id: 'threads', name: 'Threads', confidence: 0.96, questionCount: 15 },
      { id: 'scheduling', name: 'Scheduling', confidence: 0.94, questionCount: 15 },
      { id: 'synchronization', name: 'Synchronization', confidence: 0.95, questionCount: 15 },
      { id: 'memory', name: 'Memory', confidence: 0.91, questionCount: 15 },
    ];
  }

  async getQuestionSet(filter: DocumentQuestionFilter): Promise<DocumentQuestionItem[]> {
    await delay(300);
    let questions = mockDocumentQuestions.filter(
      (q) => filter.selectedTopicIds.length === 0 || filter.selectedTopicIds.includes(q.topicId)
    );

    if (filter.difficulty) {
      const diff = filter.difficulty === 'foundational' ? 'easy' : filter.difficulty;
      questions = questions.filter((q) => q.difficulty === diff);
    }

    if (filter.count && filter.count > 0) {
      questions = questions.slice(0, filter.count);
    }

    return questions;
  }

  async getAllDocuments(): Promise<DocumentProfile[]> {
    await delay(200);
    return this.documents;
  }

  async getDocumentById(documentId: string): Promise<DocumentProfile | null> {
    await delay(150);
    return this.documents.find((d) => d.id === documentId) ?? this.documents[0] ?? null;
  }

  async getAllTopics(documentId?: string): Promise<DocumentTopic[]> {
    await delay(150);
    if (!documentId) return mockDocumentTopics;
    return mockDocumentTopics.filter((t) => t.documentId === documentId);
  }
}

export const documentService = new MockDocumentProcessingService();
