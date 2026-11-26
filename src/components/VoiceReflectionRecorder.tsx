import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Volume2,
  X
} from 'lucide-react';
import { VoiceReflectionMeta } from '../types/lms';
import {
  deleteVoiceClipBlob,
  getVoiceClipBlob,
  saveVoiceClipBlob
} from '../utils/audioStorage';
import { formatTimeBn, toBengaliDigits } from '../utils/lmsHelpers';

interface VoiceReflectionRecorderProps {
  lessonId: string;
  reflections: VoiceReflectionMeta[];
  onAddReflection: (meta: VoiceReflectionMeta) => void;
  onDeleteReflection: (clipId: string) => void;
}

const MAX_RECORDING_SECONDS = 120;
const MAX_CLIPS_PER_LESSON = 5;
const BAR_COUNT = 14;

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  for (const type of candidates) {
    if (
      typeof MediaRecorder.isTypeSupported === 'function' &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return '';
}

function getExtensionFromMime(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

function getFriendlyMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  const msg = err instanceof Error ? err.message : String(err);
  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    msg.toLowerCase().includes('permission')
  ) {
    return 'মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে মাইক্রোফোন অনুমতি দিয়ে আবার চেষ্টা করুন।';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'কোনো মাইক্রোফোন ডিভাইস পাওয়া যায়নি। অনুগ্রহ করে একটি মাইক্রোফোন সংযুক্ত করুন।';
  }
  if (name === 'NotReadableError') {
    return 'মাইক্রোফোনটি অন্য কোনো অ্যাপে ব্যবহৃত হচ্ছে। সেটি বন্ধ করে আবার চেষ্টা করুন।';
  }
  return 'ভয়েস রেকর্ডিং শুরু করা যায়নি। অনুগ্রহ করে ব্রাউজারের অডিও সেটিংস পরীক্ষা করুন।';
}

interface VoiceReflectionPlayerRowProps {
  clip: VoiceReflectionMeta;
  onDelete: (clipId: string) => void;
}

const VoiceReflectionPlayerRow: React.FC<VoiceReflectionPlayerRowProps> = ({
  clip,
  onDelete
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.durationSec);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setLoadingBlob(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(clip.durationSec);

    void getVoiceClipBlob(clip.id).then((blob) => {
      if (!active) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
      } else {
        setAudioUrl(null);
      }
      setLoadingBlob(false);
    });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [clip.id, clip.durationSec]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSec = Number(e.target.value);
    setCurrentTime(nextSec);
    if (audioRef.current) {
      audioRef.current.currentTime = nextSec;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const ext = getExtensionFromMime(clip.mimeType);
    const anchor = document.createElement('a');
    anchor.href = audioUrl;
    anchor.download = `${clip.id}.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const effectiveDuration = Math.max(1, duration || clip.durationSec || 1);

  return (
    <div className="p-3 rounded-xl glass-well flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (
              audioRef.current &&
              Number.isFinite(audioRef.current.duration) &&
              audioRef.current.duration > 0
            ) {
              setDuration(Math.round(audioRef.current.duration));
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={loadingBlob || !audioUrl}
          aria-label={isPlaying ? `${clip.label} বিরতি` : `${clip.label} শুনুন`}
          className="w-9 h-9 rounded-full btn-3d-emerald disabled:opacity-50 inline-flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {loadingBlob ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#132219] truncate">
              {clip.label}
            </span>
            <span className="font-mono tabular-nums text-[11px] text-[#3F5247] shrink-0">
              {formatTimeBn(Math.floor(currentTime))} /{' '}
              {formatTimeBn(effectiveDuration)} · {clip.createdAt}
            </span>
          </div>

          {audioUrl ? (
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              step={0.1}
              value={Math.min(currentTime, effectiveDuration)}
              onChange={handleSeek}
              aria-label={`${clip.label} প্লেব্যাক অবস্থান`}
              className="w-full h-1.5 accent-[#15803D] cursor-pointer"
            />
          ) : !loadingBlob ? (
            <div className="text-[11px] text-[#B45309]">
              এই ব্রাউজার ডিভাইসে অডিও ফাইলটি স্থানীয়ভাবে সংরক্ষিত নেই
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {audioUrl && (
          <button
            type="button"
            onClick={handleDownload}
            aria-label={`${clip.label} ডাউনলোড করুন`}
            title="অডিও ডাউনলোড"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#3F5247] hover:text-[#132219] hover:bg-white/75 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(clip.id)}
          aria-label={`${clip.label} মুছুন`}
          title="অডিও মুছুন"
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#3F5247] hover:text-[#DC2626] hover:bg-[#FEF2F2]/90 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const VoiceReflectionRecorder: React.FC<VoiceReflectionRecorderProps> = ({
  lessonId,
  reflections,
  onAddReflection,
  onDeleteReflection
}) => {
  const [recState, setRecState] = useState<'idle' | 'recording' | 'paused' | 'saving'>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.18));
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const discardRef = useRef(false);
  const elapsedRef = useRef(0);
  const reflectionsCountRef = useRef(reflections.length);

  useEffect(() => {
    reflectionsCountRef.current = reflections.length;
  }, [reflections.length]);

  const cleanupHardware = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setLevels(Array(BAR_COUNT).fill(0.18));
  }, []);

  // Abort active recording cleanly if user switches lessons or unmounts
  useEffect(() => {
    return () => {
      discardRef.current = true;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors on unmount
        }
      }
      mediaRecorderRef.current = null;
      cleanupHardware();
      setRecState('idle');
      setElapsedSec(0);
      elapsedRef.current = 0;
    };
  }, [lessonId, cleanupHardware]);

  const startMeterLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(dataArray.length / BAR_COUNT));
      const nextBars: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const val = dataArray[i * step] ?? 0;
        nextBars.push(Math.max(0.18, Math.min(1, val / 180)));
      }
      setLevels(nextBars);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  const handleStopAndSave = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    discardRef.current = false;
    setRecState('saving');
    try {
      recorder.stop();
    } catch {
      cleanupHardware();
      setRecState('idle');
    }
  }, [cleanupHardware]);

  const handleDiscard = useCallback(() => {
    discardRef.current = true;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // Ignore
      }
    }
    mediaRecorderRef.current = null;
    cleanupHardware();
    setRecState('idle');
    setElapsedSec(0);
    elapsedRef.current = 0;
  }, [cleanupHardware]);

  const handleStartRecording = async () => {
    setMicError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setMicError(
        'আপনার বর্তমান ব্রাউজার মাইক্রোফোন রেকর্ডিং সমর্থন করছে না।'
      );
      return;
    }

    if (reflections.length >= MAX_CLIPS_PER_LESSON) {
      setMicError(
        `প্রতি পাঠে সর্বোচ্চ ${toBengaliDigits(MAX_CLIPS_PER_LESSON)}টি অডিও প্রতিফলন সংরক্ষণ করা যায়।`
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = pickSupportedMimeType();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;
      elapsedRef.current = 0;
      setElapsedSec(0);

      // Setup live waveform analyser
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
          startMeterLoop();
        }
      } catch {
        // Visualizer is optional; recording continues cleanly
      }

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const wasDiscarded = discardRef.current;
        const recordedDuration = Math.max(1, elapsedRef.current);
        const mimeType = recorder.mimeType || preferredMime || 'audio/webm';
        const chunks = [...chunksRef.current];
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        cleanupHardware();

        if (wasDiscarded || chunks.length === 0) {
          setRecState('idle');
          setElapsedSec(0);
          elapsedRef.current = 0;
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const clipId = `voice-${lessonId}-${Date.now()}`;
        const nextIndex = reflectionsCountRef.current + 1;
        const createdAt = new Date().toLocaleDateString('bn-BD', {
          month: 'short',
          day: 'numeric'
        });

        try {
          await saveVoiceClipBlob(clipId, blob);
          onAddReflection({
            id: clipId,
            durationSec: recordedDuration,
            mimeType,
            createdAt,
            label: `অডিও প্রতিফলন ০${toBengaliDigits(nextIndex)}`
          });
        } catch {
          setMicError(
            'অডিও প্রতিফলনটি ব্রাউজার স্টোরেজে সংরক্ষণ করা যায়নি।'
          );
        } finally {
          setRecState('idle');
          setElapsedSec(0);
          elapsedRef.current = 0;
        }
      };

      recorder.start(250);
      setRecState('recording');

      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSec(elapsedRef.current);
        if (elapsedRef.current >= MAX_RECORDING_SECONDS) {
          handleStopAndSave();
        }
      }, 1000);
    } catch (err) {
      cleanupHardware();
      setRecState('idle');
      setMicError(getFriendlyMicError(err));
    }
  };

  const handleTogglePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === 'recording' && typeof recorder.pause === 'function') {
      recorder.pause();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setLevels(Array(BAR_COUNT).fill(0.18));
      setRecState('paused');
    } else if (
      recorder.state === 'paused' &&
      typeof recorder.resume === 'function'
    ) {
      recorder.resume();
      setRecState('recording');
      startMeterLoop();
      timerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSec(elapsedRef.current);
        if (elapsedRef.current >= MAX_RECORDING_SECONDS) {
          handleStopAndSave();
        }
      }, 1000);
    }
  };

  const handleDeleteClip = (clipId: string) => {
    void deleteVoiceClipBlob(clipId);
    onDeleteReflection(clipId);
  };

  return (
    <div className="pt-4 border-t border-white/75 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[#3F5247]">
          <Volume2 className="w-4 h-4 text-[#15803D] shrink-0" />
          <span>
            <strong className="text-[#132219]">ভয়েস প্রতিফলন (Voice Reflection)</strong>{' '}
            · টাইপ না করে মুখে রেকর্ড করুন
          </span>
        </div>

        <div className="text-[11px] font-mono tabular-nums text-[#3F5247]">
          {toBengaliDigits(reflections.length)}/{toBengaliDigits(MAX_CLIPS_PER_LESSON)} ক্লিপ
        </div>
      </div>

      {/* Recorder Strip */}
      {recState === 'idle' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl glass-well">
          <div className="text-xs text-[#3F5247] leading-relaxed">
            ক্লাস শেষে বা পাঠ দেখার পর আপনার তাৎক্ষণিক ভাবনা মাইক্রোফোনে সংক্ষেপে রেকর্ড করে রাখুন (সর্বোচ্চ ২ মিনিট)।
          </div>
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={reflections.length >= MAX_CLIPS_PER_LESSON}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold btn-3d-emerald disabled:opacity-50 disabled:cursor-not-allowed rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>ভয়েস রেকর্ড করুন</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl glass-well ring-1 ring-[#15803D]/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#DC2626] text-white inline-flex items-center justify-center shadow-sm shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#132219]">
                  {recState === 'paused'
                    ? 'রেকর্ডিং বিরতি দেওয়া হয়েছে'
                    : recState === 'saving'
                    ? 'অডিও সংরক্ষণ করা হচ্ছে...'
                    : 'মাইক্রোফোন রেকর্ড চলছে...'}
                </div>
                <div className="text-xs font-mono tabular-nums text-[#3F5247]">
                  {formatTimeBn(elapsedSec)} / {formatTimeBn(MAX_RECORDING_SECONDS)}
                </div>
              </div>
            </div>

            {/* Live Waveform Bars */}
            <div
              aria-hidden="true"
              className="flex items-center gap-1 h-7 px-2"
            >
              {levels.map((lvl, idx) => (
                <span
                  key={idx}
                  className="w-1 h-6 rounded-full bg-[#15803D] transition-transform duration-75 origin-center"
                  style={{ transform: `scaleY(${lvl})` }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleStopAndSave}
              disabled={recState === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald disabled:opacity-60 rounded-xl min-h-[38px] cursor-pointer"
            >
              {recState === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
              <span>থামান ও সংরক্ষণ করুন</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePause}
              disabled={recState === 'saving'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[38px] cursor-pointer"
            >
              {recState === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>চালু করুন</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>বিরতি</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              disabled={recState === 'saving'}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#3F5247] hover:text-[#DC2626] transition-colors min-h-[38px] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>বাতিল</span>
            </button>
          </div>
        </div>
      )}

      {micError && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#B91C1C]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      {/* Saved Voice Reflections List */}
      {reflections.length > 0 && (
        <div className="space-y-2">
          {reflections.map((clip) => (
            <VoiceReflectionPlayerRow
              key={clip.id}
              clip={clip}
              onDelete={handleDeleteClip}
            />
          ))}
        </div>
      )}
    </div>
  );
};
