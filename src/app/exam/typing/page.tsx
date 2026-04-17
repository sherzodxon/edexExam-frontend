'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, addTypingAttempt, getBestTyping, MAX_TYPING_ATTEMPTS, saveStoredUser } from '@/lib/storage';
import { api } from '@/lib/api';
import { TypingAttempt, StoredUser } from '@/types';
import ExamLayout from '@/components/ExamLayout';
import TypingArea, { TypingResult } from '@/components/TypingArea';

type Phase = 'typing' | 'result' | 'done';

export default function TypingExamPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [phase, setPhase] = useState<Phase>('typing');
  const [lastResult, setLastResult] = useState<TypingAttempt | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) { router.replace('/register'); return; }
    if (stored.typingDone) { router.replace('/exam/test'); return; }
    setUser(stored);
  }, [router]);

  const attemptsUsed = user?.typingAttempts.length ?? 0;
  const isLastAttempt = attemptsUsed >= MAX_TYPING_ATTEMPTS;
  const best = useMemo(() => (user ? getBestTyping(user.typingAttempts) : null), [user]);

  const handleComplete = useCallback(
    async (result: TypingAttempt) => {
      if (isSaving) return;
      const stored = getStoredUser();
      if (!stored || stored.typingAttempts.length >= MAX_TYPING_ATTEMPTS) return;

      setIsSaving(true);

      // 1. Localga saqlash
      const updated = addTypingAttempt(result);
      if (!updated) { setIsSaving(false); return; }
      setUser({ ...updated });
      setLastResult(result);

      const newAttempts = updated.typingAttempts;
      // Local hisobi bo'yicha 3 ta to'ldimi — backendga bog'liq emas
      const allDone = newAttempts.length >= MAX_TYPING_ATTEMPTS;

      // 2. Backendga yuborish (fon rejimida, natija kutilmaydi)
      api.submitTypingAttempt({
        token: stored.userInfo.token,
        wpm: result.wpm,
        rawWpm: result.rawWpm,
        accuracy: result.accuracy,
        correctWords: result.correctWords,
        totalWords: result.totalWords,
      }).catch((err: unknown) => console.error('Submit attempt error:', err));

      // 3. 3 ta urinish tugagan bo'lsa — yakunlaymiz
      if (allDone) {
        const bestWpm = Math.max(...newAttempts.map((a) => a.wpm));
        const bestScore = parseFloat((bestWpm * 0.8).toFixed(2));
        const finalUser: StoredUser = {
          ...updated,
          typingDone: true,
          typingScore: bestScore,
        };
        saveStoredUser(finalUser);
        setUser(finalUser);
        setPhase('done');
        return;
      }

      // 4. Hali urinishlar qolgan — natija ekranini ko'rsat
      setPhase('result');
    },
    [isSaving]
  );

  const handleNextAttempt = () => {
    setIsSaving(false);
    setPhase('typing');
    setLastResult(null);
    setAttemptKey((k) => k + 1);
  };

  const handleFinish = () => {
    // 3 ta urinishdan keyin — backend allaqachon status o'zgartirdi
    router.push('/exam/test');
  };

  if (!user) return <Spinner />;

  return (
    <ExamLayout phase="typing">
      <div className="flex-1 flex flex-col items-center  px-4 py-8">
        {/* Attempt indicators */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: MAX_TYPING_ATTEMPTS }).map((_, i) => {
            const attempt = user.typingAttempts[i];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono
                  ${attempt
                    ? 'border-accent/40 bg-accent/5 text-accent'
                    : i === attemptsUsed && phase === 'typing'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted'}`}
                >
                  <span>{i + 1}-urinish</span>
                  {attempt && <span className="text-accent font-semibold">{attempt.wpm} WPM</span>}
                </div>
                {i < MAX_TYPING_ATTEMPTS - 1 && (
                  <div className={`w-6 h-px ${i < attemptsUsed ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Typing area */}
        {phase === 'typing' && (
          <div className="w-full max-w-6xl animate-fade-in">
            <TypingArea
              attemptNumber={attemptKey}
              onComplete={(r: TypingResult) =>
                handleComplete({
                  ...r,
                  score: parseFloat((r.wpm * 0.8).toFixed(2)),
                  timestamp: Date.now(),
                  attemptNumber: attemptsUsed + 1,
                })
              }
            />
          </div>
        )}

        {/* Result after attempt */}
        {phase === 'result' && lastResult && (
          <div className="animate-scale-in w-full max-w-sm">
            <AttemptResult
              result={lastResult}
              attemptNumber={user.typingAttempts.length}
              attemptsLeft={MAX_TYPING_ATTEMPTS - user.typingAttempts.length}
              best={best}
              onNext={handleNextAttempt}
            />
          </div>
        )}

        {/* All done */}
        {phase === 'done' && best && (
          <div className="animate-scale-in w-full max-w-sm">
            <div className="bg-surface border border-accent/30 rounded-2xl p-8 text-center space-y-5">
              <div className="text-4xl">🎉</div>
              <div>
                <p className="text-sub text-sm font-mono mb-1">Eng yaxshi natija</p>
                <p className="text-5xl font-mono font-bold text-accent">{best.wpm}</p>
                <p className="text-sub text-sm mt-1">WPM</p>
              </div>
              <div className="bg-bg rounded-xl p-4 border border-border space-y-2">
                <ScoreLine label="Typing bali" value={`${parseFloat((best.wpm * 0.8).toFixed(1))} / 60`} />
                <ScoreLine label="Aniqlik" value={`${best.accuracy.toFixed(1)}%`} />
              </div>
              <p className="text-sub text-sm">Typing bosqichi yakunlandi ✓</p>
              <button
                onClick={handleFinish}
                className="w-full bg-accent text-bg font-mono font-semibold py-3 rounded-xl
                  hover:bg-accent-dim transition-all"
              >
                Test bosqichiga o'tish →
              </button>
            </div>
          </div>
        )}
      </div>
    </ExamLayout>
  );
}

function AttemptResult({
  result, attemptNumber, attemptsLeft, best, onNext,
}: {
  result: TypingAttempt;
  attemptNumber: number;
  attemptsLeft: number;
  best: TypingAttempt | null;
  onNext: () => void;
}) {
  const isBest = !best || result.wpm >= best.wpm;

  return (
    <div className="bg-surface border border-border rounded-2xl p-7 space-y-5 text-center">
      <div>
        <p className="text-sub text-xs font-mono uppercase tracking-widest mb-2">
          {attemptNumber}-urinish natijasi
          {isBest && <span className="ml-2 text-accent">★ Eng yaxshi</span>}
        </p>
        <p className="text-6xl font-mono font-bold text-text">{result.wpm}</p>
        <p className="text-sub text-sm mt-1">WPM</p>
      </div>

      <div className="bg-bg rounded-xl p-4 border border-border space-y-2 text-sm">
        <ScoreLine label="Ball" value={`${result.score}`} accent />
        <ScoreLine label="Aniqlik" value={`${result.accuracy.toFixed(1)}%`} />
        <ScoreLine label="To'g'ri so'zlar" value={`${result.correctWords}`} />
      </div>

      {attemptsLeft > 0 ? (
        <div className="space-y-3">
          <p className="text-sub text-sm">{attemptsLeft} ta urinish qoldi</p>
          <button
            onClick={onNext}
            className="w-full bg-accent text-bg font-mono font-semibold py-3 rounded-xl
              hover:bg-accent-dim transition-all"
          >
            Qayta urinish →
          </button>
        </div>
      ) : (
        <p className="text-sub text-sm animate-pulse">Natijalar qayta ishlanmoqda...</p>
      )}
    </div>
  );
}

function ScoreLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-sub">{label}</span>
      <span className={`font-mono font-medium ${accent ? 'text-accent' : 'text-text'}`}>{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
