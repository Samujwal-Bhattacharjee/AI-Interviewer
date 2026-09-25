import { useCallback, useRef } from 'react';
import { useInterviewStore } from '../store/interviewStore';
import { getNextQuestion, submitAnswer } from '../services/interviewService';
import { startInterview } from '../services/assessmentService';
import { voiceService } from '../services/voiceService';
import { DATA_MODE } from '../lib/api';

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

/**
 * useInterview — orchestrates the real voice interview state machine.
 *
 * Flow:
 * SPEAKING (ElevenLabs streaming TTS)
 *   ↓ (auto on audio end)
 * LISTENING (Browser SpeechRecognition)
 *   ↓ (candidate finishes speaking)
 * TRANSCRIBING
 *   ↓
 * EVALUATING (LLM/Semantic concepts & evidence extraction)
 *   ↓ (adaptive state updated visibly)
 * SPEAKING (Next question via ElevenLabs)
 */
export function useInterview() {
  const store = useInterviewStore();

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const listenStartRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);

  // ── Begin listening via Web Speech API ────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListeningRef.current) return;

    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Web Speech API not supported in this browser. Please use Chrome/Edge for STT.');
      store.setVoiceState('listening');
      isListeningRef.current = true;
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i]?.[0]?.transcript ?? '';
        }
        if (text.trim()) {
          store.setTranscript(text.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser to respond verbally.');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
      listenStartRef.current = Date.now();
      recognition.start();
      isListeningRef.current = true;
      store.setVoiceState('listening');
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      store.setVoiceState('listening');
    }
  }, [store]);

  // ── Load the next question, play ElevenLabs audio, then auto-listen ───────
  const loadNextQuestion = useCallback(
    async (sessionId: string, index: number) => {
      // Clear previous adaptation notice when moving to new question
      store.setAdaptationNotice(null);
      store.setVoiceState('idle');

      const question = await getNextQuestion(sessionId);
      store.setQuestion(question, index);

      // Transition to SPEAKING state
      store.setVoiceState('speaking');

      try {
        // Generates ElevenLabs audio from backend, with Web Speech fallback
        await voiceService.speak(question.question);
      } catch (err) {
        console.warn('Speech playback error, continuing to listening:', err);
      }

      // Interviewer finished speaking — automatically transition to LISTENING
      startListening();
    },
    [store, startListening]
  );

  // ── Start a session — transitions backend to 'active', loads first question ─
  const startSession = useCallback(
    async (sessionId: string, _targetRoleId: string) => {
      if (DATA_MODE === 'api') {
        try {
          await startInterview(sessionId);
        } catch {
          // 409 means session already started — continue normally
        }
      }
      await loadNextQuestion(sessionId, 0);
    },
    [loadNextQuestion]
  );

  // ── Stop listening and submit answer to backend ───────────────────────────
  const stopListening = useCallback(async () => {
    const currentSessionId = useInterviewStore.getState().sessionId;
    const currentQuestion = useInterviewStore.getState().currentQuestion;
    if (!currentSessionId || !currentQuestion) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped
      }
      recognitionRef.current = null;
    }
    isListeningRef.current = false;

    // Small delay to ensure the last interim/final speech buffer flushed
    store.setVoiceState('transcribing');
    await new Promise<void>((r) => setTimeout(r, 400));

    const finalTranscript = useInterviewStore.getState().transcript.trim();

    // Guard: Do NOT submit an empty transcript!
    if (!finalTranscript) {
      console.warn('Cannot submit an empty transcript. Returning to listening state.');
      store.setVoiceState('listening');
      startListening();
      return;
    }

    const durationMs = Date.now() - listenStartRef.current;
    store.setVoiceState('evaluating');

    try {
      const result = await submitAnswer(currentSessionId, {
        questionId: currentQuestion.id,
        answerText: finalTranscript,
        transcript: finalTranscript,
        durationMs,
      });

      // Update attempt history
      store.addAttempt(result.attempt);

      // Real skill estimate updates
      if (result.updatedSkillEstimates.length > 0) {
        store.updateSkillEstimates(result.updatedSkillEstimates);
      }

      // Capture delta for visible adaptation banner
      const prevDifficulty = useInterviewStore.getState().adaptiveState.currentDifficulty;
      const prevEstimate = useInterviewStore.getState().adaptiveState.currentEstimate;
      store.updateAdaptiveState(result.adaptiveState);

      store.setAdaptationNotice({
        competencyName: currentQuestion.competencyId,
        previousDifficulty: prevDifficulty,
        nextDifficulty: result.adaptiveState.currentDifficulty,
        previousEstimate: prevEstimate,
        newEstimate: result.adaptiveState.currentEstimate,
        action: result.adaptiveState.lastAction ?? 'probe',
      });

      // Give candidate 1.8s to see the visible adaptation state before next question
      await new Promise<void>((r) => setTimeout(r, 1800));

      const currentIndex = useInterviewStore.getState().questionIndex;
      const total = useInterviewStore.getState().totalQuestions;

      if (currentIndex + 1 >= total) {
        store.completeInterview();
      } else {
        await loadNextQuestion(currentSessionId, currentIndex + 1);
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      // Let user retry
      store.setVoiceState('listening');
    }
  }, [store, startListening, loadNextQuestion]);

  return {
    ...store,
    startSession,
    startListening,
    stopListening,
  };
}
