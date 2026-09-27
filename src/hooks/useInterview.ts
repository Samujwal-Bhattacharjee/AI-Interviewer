import { useCallback, useRef, useState } from 'react';
import { useInterviewStore } from '../store/interviewStore';
import { getNextQuestion, submitAnswer } from '../services/interviewService';
import { startInterview } from '../services/assessmentService';
import { voiceService } from '../services/voiceService';
import type { VoiceEngineStatus } from '../services/voiceService';
import { DATA_MODE } from '../lib/api';

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      length: number;
      isFinal?: boolean;
      [index: number]: { transcript: string };
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
 *   ↓ (user clicks STOP ANSWER)
 * TRANSCRIBING
 *   ↓
 * EVALUATING (Groq LLM evidence extraction)
 *   ↓ (adaptive state updated visibly)
 * SPEAKING (Next question via ElevenLabs)
 */
export function useInterview() {
  const store = useInterviewStore();

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const listenStartRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);

  // Guard: prevent duplicate answer submissions
  const isSubmittingRef = useRef<boolean>(false);

  // Voice engine status for UI badge
  const [voiceEngineStatus, setVoiceEngineStatus] = useState<VoiceEngineStatus | null>(null);

  // ── Begin listening via Web Speech API ────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListeningRef.current) return;

    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('[useInterview] Web Speech API not supported. Use Chrome/Edge for STT.');
      store.setVoiceState('listening');
      isListeningRef.current = true;
      return;
    }

    // Reset transcript before each question
    store.setTranscript('');

    try {
      const recognition = new SpeechRecognitionAPI();
      const isNativeMode = store.interviewMode === 'mode1_native' || store.interviewMode === 'native';
      const activeLang = isNativeMode ? (store.selectedLanguage || 'hi-IN') : 'en-IN';
      recognition.lang = activeLang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        // Build transcript from ALL results — avoids duplication by rebuilding from scratch
        let finalText = '';
        let interimText = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const chunk = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += chunk + ' ';
          } else {
            interimText += chunk;
          }
        }
        const combined = (finalText + interimText).trim();
        if (combined) {
          store.setTranscript(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error('[useInterview] Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        }
        // On network/aborted errors, keep listening state — don't auto-submit
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      listenStartRef.current = Date.now();
      recognition.start();
      isListeningRef.current = true;
      store.setVoiceState('listening');
    } catch (err) {
      console.warn('[useInterview] Could not start speech recognition:', err);
      store.setVoiceState('listening');
    }
  }, [store]);

  // ── Load the next question, play ElevenLabs audio, then auto-listen ───────
  const loadNextQuestion = useCallback(
    async (sessionId: string, index: number) => {
      store.setAdaptationNotice(null);
      store.setVoiceState('idle');

      const question = await getNextQuestion(sessionId);
      store.setQuestion(question, index);

      store.setVoiceState('speaking');

      const isNativeMode = store.interviewMode === 'mode1_native' || store.interviewMode === 'native';
      const localized = question.localizedQuestionText || question.questionTranslated;
      const textToSpeak = isNativeMode && localized ? localized : question.question;
      const speechLang = isNativeMode ? (question.questionLanguage || store.selectedLanguage || 'hi-IN') : 'en-IN';

      // Section 19: Debug logging
      console.log('QUESTION LANGUAGE:', speechLang);
      console.log('QUESTION ORIGINAL:', question.question);
      console.log('QUESTION LOCALIZED:', localized || question.question);
      console.log('TTS LANGUAGE:', speechLang);

      try {
        await voiceService.speak(textToSpeak, speechLang);
      } catch (err) {
        console.warn('[useInterview] Speech playback error, continuing to listening:', err);
      }

      // Interviewer finished — transition to LISTENING
      startListening();
    },
    [store, startListening]
  );

  // ── Start a session — unlock audio, transitions backend to 'active', loads first question ─
  const startSession = useCallback(
    async (sessionId: string, _targetRoleId: string) => {
      // CRITICAL: unlock audio from the user-gesture call stack
      voiceService.unlockAudioContext();

      // Fetch voice engine status to show in UI
      const status = await voiceService.fetchEngineStatus();
      setVoiceEngineStatus(status);

      if (DATA_MODE === 'api') {
        try {
          await startInterview(sessionId);
        } catch {
          // 409 = session already started — continue
        }
      }
      await loadNextQuestion(sessionId, 0);
    },
    [loadNextQuestion]
  );

  // ── Stop listening and submit answer to backend — guarded against double-submit ───
  const stopListening = useCallback(async () => {
    // Prevent double-submission
    if (isSubmittingRef.current) {
      console.warn('[useInterview] Submission already in progress — ignoring duplicate stopListening call.');
      return;
    }

    const currentSessionId = useInterviewStore.getState().sessionId;
    const currentQuestion = useInterviewStore.getState().currentQuestion;
    if (!currentSessionId || !currentQuestion) return;

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    isListeningRef.current = false;

    // Brief delay to flush final speech buffer
    store.setVoiceState('transcribing');
    await new Promise<void>((r) => setTimeout(r, 500));

    const finalTranscript = useInterviewStore.getState().transcript.trim();

    // Guard: do NOT submit empty transcript
    if (!finalTranscript) {
      console.warn('[useInterview] Empty transcript — returning to listening state.');
      store.setVoiceState('listening');
      startListening();
      return;
    }

    isSubmittingRef.current = true;
    const durationMs = Date.now() - listenStartRef.current;
    store.setVoiceState('evaluating');

    try {
      const activeLanguage = useInterviewStore.getState().selectedLanguage || 'en-US';
      const result = await submitAnswer(currentSessionId, {
        questionId: currentQuestion.id,
        answerText: finalTranscript,
        transcript: finalTranscript,
        durationMs,
        language: activeLanguage,
      });

      if (result.professionalEnglishTranslation) {
        store.setProfessionalEnglishVersion(result.professionalEnglishTranslation);
      }

      store.addAttempt(result.attempt);

      if (result.updatedSkillEstimates.length > 0) {
        store.updateSkillEstimates(result.updatedSkillEstimates);
      }

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

      // Show adaptation notice for 1.8s before moving on
      await new Promise<void>((r) => setTimeout(r, 1800));

      const currentIndex = useInterviewStore.getState().questionIndex;
      const total = useInterviewStore.getState().totalQuestions;

      if (currentIndex + 1 >= total) {
        store.completeInterview();
      } else {
        await loadNextQuestion(currentSessionId, currentIndex + 1);
      }
    } catch (err) {
      console.error('[useInterview] Answer submission error:', err);
      store.setVoiceState('listening');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [store, startListening, loadNextQuestion]);

  return {
    ...store,
    startSession,
    startListening,
    stopListening,
    voiceEngineStatus,
  };
}
