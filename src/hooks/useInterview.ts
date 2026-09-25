import { useCallback, useEffect } from 'react';
import { useInterviewStore } from '../store/interviewStore';
import { getNextQuestion, submitAnswer } from '../services/interviewService';
import type { VoiceState } from '../types/interview';

/**
 * useInterview — orchestrates the interview state machine.
 *
 * Phase 1: Simulates voice states with setTimeout.
 * Phase 2: Replace simulation with:
 *   - WebSocket event handler from FastAPI
 *   - STT: MediaRecorder → audio stream → FastAPI
 *   - TTS: text from FastAPI → Web Speech API or ElevenLabs audio
 *
 * Future WebSocket hook would be:
 *   useEffect(() => {
 *     const ws = new WebSocket(`${WS_URL}/ws/sessions/${sessionId}`);
 *     ws.onmessage = ({ data }) => {
 *       const event = JSON.parse(data);
 *       handleInterviewEvent(event);
 *     };
 *     return () => ws.close();
 *   }, [sessionId]);
 */
export function useInterview() {
  const store = useInterviewStore();

  const startSession = useCallback(async (sessionId: string, targetRoleId: string) => {
    store.setSession(sessionId, targetRoleId, 10);
    await loadNextQuestion(sessionId, 0);
  }, []);

  const loadNextQuestion = useCallback(async (sessionId: string, index: number) => {
    store.setVoiceState('idle');
    const question = await getNextQuestion(sessionId);
    store.setQuestion(question, index);
    // Simulate TTS speaking
    store.setVoiceState('speaking');
    await new Promise((r) => setTimeout(r, 2500));
    store.setVoiceState('idle');
  }, []);

  const startListening = useCallback(() => {
    // Phase 2: navigator.mediaDevices.getUserMedia({ audio: true })
    store.setVoiceState('listening');
  }, []);

  const stopListening = useCallback(async () => {
    if (!store.sessionId || !store.currentQuestion) return;
    store.setVoiceState('transcribing');
    await new Promise((r) => setTimeout(r, 1500));

    const mockTranscript = 'The system uses a hash function to compute an index from the key, which maps to a bucket in memory. On average, each bucket has O(1) access time because lookups go directly to the computed index.';
    store.setTranscript(mockTranscript);
    store.setVoiceState('evaluating');
    await new Promise((r) => setTimeout(r, 2000));

    const attempt = await submitAnswer(store.sessionId, {
      questionId: store.currentQuestion.id,
      answerText: mockTranscript,
      transcript: mockTranscript,
    });
    store.addAttempt(attempt);

    if (store.questionIndex + 1 >= store.totalQuestions) {
      store.completeInterview();
    } else {
      await loadNextQuestion(store.sessionId, store.questionIndex + 1);
    }
  }, [store.sessionId, store.currentQuestion, store.questionIndex, store.totalQuestions]);

  return {
    ...store,
    startSession,
    startListening,
    stopListening,
  };
}
