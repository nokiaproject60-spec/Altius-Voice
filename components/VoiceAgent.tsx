
import React, { useState, useRef, useCallback } from 'react';
import {
  initGeminiLive,
  decodeAudio,
  decodeAudioData,
  createPcmBlob,
  stripCitationsForSpeech
} from '../services/geminiService';
import { SessionStatus } from '../types';
import { LiveServerMessage } from '@google/genai';

interface VoiceAgentProps {
  pdfContent: string;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ pdfContent }) => {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [userSpeech, setUserSpeech] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper to cleanly stop all audio and session related tasks
  const handleStop = useCallback(() => {
    if (sessionRef.current) {
      // Logic for closing
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) { }
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try {
        outputAudioContextRef.current.close();
      } catch (e) { }
      outputAudioContextRef.current = null;
    }

    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch (e) { }
    }
    sourcesRef.current.clear();

    setStatus(SessionStatus.IDLE);
    setTranscription('');
    setUserSpeech('');
  }, []);

  const handleStart = async () => {
    try {
      setStatus(SessionStatus.CONNECTING);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // FIX: Added required onOpen property and used sessionPromise pattern to ensure safe streaming
      const sessionPromise = initGeminiLive(pdfContent, {
        onOpen: () => {
          setStatus(SessionStatus.ACTIVE);
        },
        onMessage: async (message: LiveServerMessage) => {
          // Handle Audio Data
          const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64 && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            const buffer = await decodeAudioData(decodeAudio(audioBase64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            source.addEventListener('ended', () => {
              sourcesRef.current.delete(source);
            });

            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }

          // Handle Transcriptions
          // if (message.serverContent?.outputTranscription) {
          //   setTranscription(prev => prev + message.serverContent?.outputTranscription?.text);
          // }
          if (message.serverContent?.outputTranscription?.text) {
            const cleanText = stripCitationsForSpeech(
              message.serverContent.outputTranscription.text
            );

            setTranscription(prev => prev + cleanText);
          }

          if (message.serverContent?.inputTranscription) {
            setUserSpeech(prev => prev + message.serverContent?.inputTranscription?.text);
          }

          if (message.serverContent?.turnComplete) {
            setTranscription(prev => prev + '\n');
            setUserSpeech(prev => prev + '\n');
          }

          // Handle Interruption
          if (message.serverContent?.interrupted) {
            for (const source of sourcesRef.current) {
              try {
                source.stop();
              } catch (e) { }
            }
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onError: (e) => {
          console.error("Voice Session Error:", e);
          setStatus(SessionStatus.ERROR);
        },
        onClose: () => {
          handleStop();
        }
      });

      sessionRef.current = await sessionPromise;

      // Start Microphone Input
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        // CRITICAL: Solely rely on sessionPromise resolves to prevent race conditions during initialization
        sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        }).catch((err) => {
          console.error("Failed to send audio input:", err);
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

    } catch (err) {
      console.error("Failed to start session", err);
      setStatus(SessionStatus.ERROR);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === SessionStatus.ACTIVE ? 'bg-green-500 animate-pulse' : status === SessionStatus.ERROR ? 'bg-red-500' : 'bg-gray-300'}`}></div>
          <h3 className="text-lg font-bold text-gray-800">Voice Assistant</h3>
        </div>
        <div className="text-sm font-medium text-gray-500">
          {status === SessionStatus.IDLE && "Ready to talk"}
          {status === SessionStatus.CONNECTING && "Establishing link..."}
          {status === SessionStatus.ACTIVE && "Listening..."}
          {status === SessionStatus.ERROR && "Connection Error"}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[120px] max-h-[250px] overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200">
        {userSpeech && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-600 uppercase">You</span>
            <p className="text-sm text-gray-700 italic">{userSpeech}</p>
          </div>
        )}
        {transcription && (
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-xs font-bold text-purple-600 uppercase">Assistant</span>
            <p className="text-sm text-gray-800">{transcription}</p>
          </div>
        )}
        {!userSpeech && !transcription && (
          <p className="text-sm text-gray-400 text-center mt-8">Voice transcript will appear here.</p>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        {status === SessionStatus.IDLE ? (
          <button
            onClick={handleStart}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Voice Session
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            End Session
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;
