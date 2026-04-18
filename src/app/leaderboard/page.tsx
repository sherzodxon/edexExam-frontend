'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Keyboard, FileQuestion, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Group = '5-6' | '7-8' | '9-11';

interface LeaderboardData {
  [key: string]: {
    label: string;
    students: LeaderboardEntry[];
  };
}

const GROUP_LABELS: { key: Group; label: string }[] = [
  { key: '5-6',  label: '5–6-sinf'  },
  { key: '7-8',  label: '7–8-sinf'  },
  { key: '9-11', label: '9–11-sinf' },
];

const AUTO_SWITCH_SEC  = 60;   // har 60 soniyada tab almashadi
const AUTO_REFRESH_SEC = 600;  // har 10 daqiqada ma'lumot yangilanadi

export default function LeaderboardPage() {
  const [data,        setData]        = useState<LeaderboardData | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group>('5-6');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // Countdown tickers
  const [switchIn,  setSwitchIn]  = useState(AUTO_SWITCH_SEC);
  const [refreshIn, setRefreshIn] = useState(AUTO_REFRESH_SEC);

  const groupIdxRef    = useRef(0);
  const switchRafRef   = useRef<number>(0);
  const refreshRafRef  = useRef<number>(0);
  const switchDlRef    = useRef(0);   // deadline ms
  const refreshDlRef   = useRef(0);

  // ── Ma'lumot yuklash ──────────────────────────────────
  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await api.getLeaderboard();
      setData((res as { data: LeaderboardData }).data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  // ── Auto-switch ticker (60s) ──────────────────────────
  const startSwitchTicker = useCallback((deadlineMs: number) => {
    cancelAnimationFrame(switchRafRef.current);
    const tick = () => {
      const rem = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setSwitchIn(rem);
      if (rem <= 0) {
        // Keyingi guruhga o'tish
        groupIdxRef.current = (groupIdxRef.current + 1) % GROUP_LABELS.length;
        setActiveGroup(GROUP_LABELS[groupIdxRef.current].key);
        // Yangi deadline
        const next = Date.now() + AUTO_SWITCH_SEC * 1000;
        switchDlRef.current = next;
        startSwitchTicker(next);
        return;
      }
      switchRafRef.current = requestAnimationFrame(tick);
    };
    switchRafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Auto-refresh ticker (10 daq) ─────────────────────
  const startRefreshTicker = useCallback((deadlineMs: number) => {
    cancelAnimationFrame(refreshRafRef.current);
    const tick = () => {
      const rem = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
      setRefreshIn(rem);
      if (rem <= 0) {
        // Ma'lumotlarni yangilash
        load(true);
        const next = Date.now() + AUTO_REFRESH_SEC * 1000;
        refreshDlRef.current = next;
        startRefreshTicker(next);
        return;
      }
      refreshRafRef.current = requestAnimationFrame(tick);
    };
    refreshRafRef.current = requestAnimationFrame(tick);
  }, [load]);

  // ── Mount ─────────────────────────────────────────────
  useEffect(() => {
    load();

    const swDl = Date.now() + AUTO_SWITCH_SEC * 1000;
    const rfDl = Date.now() + AUTO_REFRESH_SEC * 1000;
    switchDlRef.current  = swDl;
    refreshDlRef.current = rfDl;

    startSwitchTicker(swDl);
    startRefreshTicker(rfDl);

    return () => {
      cancelAnimationFrame(switchRafRef.current);
      cancelAnimationFrame(refreshRafRef.current);
    };
  }, [load, startSwitchTicker, startRefreshTicker]);

  // ── Qo'lda tab o'zgartirish — timer reset ─────────────
  const handleTabClick = (key: Group) => {
    groupIdxRef.current = GROUP_LABELS.findIndex(g => g.key === key);
    setActiveGroup(key);
    // Switch timerini reset qilish
    const next = Date.now() + AUTO_SWITCH_SEC * 1000;
    switchDlRef.current = next;
    startSwitchTicker(next);
  };

  // ── Qo'lda refresh ───────────────────────────────────
  const handleManualRefresh = () => {
    load(true);
    const next = Date.now() + AUTO_REFRESH_SEC * 1000;
    refreshDlRef.current = next;
    startRefreshTicker(next);
  };

  const students = data?.[activeGroup]?.students ?? [];

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  };

  // Switch progress foizi
  const switchPct = (switchIn / AUTO_SWITCH_SEC) * 100;

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] grid-bg" />
      <div className="max-w-4xl mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={24} className="text-accent" />
            <h1 className="text-xl font-semibold text-text font-mono">Reyting</h1>
          </div>

          {/* Refresh info + tugma */}
          <div className="flex items-center gap-3">
            <span className="text-muted text-xs font-mono hidden sm:block">
              yangilanadi: {fmtTime(refreshIn)}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-muted hover:text-sub text-xs font-mono
                border border-border rounded-lg px-2.5 py-1.5 hover:border-muted transition-all disabled:opacity-40"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              Yangilash
            </button>
          </div>
        </div>

        {/* Group tabs — switch progress bilan */}
        <div className="bg-surface border border-border rounded-xl p-1 relative overflow-hidden">
          {/* Progress bar — qaysi tabga o'tishigacha */}
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-accent/40 transition-none"
            style={{ width: `${100 - switchPct}%`, transitionDuration: '0ms' }}
          />
          <div className="flex gap-1 relative">
            {GROUP_LABELS.map((g, i) => (
              <button
                key={g.key}
                onClick={() => handleTabClick(g.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-medium transition-all relative
                  ${activeGroup === g.key ? 'bg-accent text-bg' : 'text-muted hover:text-sub'}`}
              >
                {g.label}
                {/* Aktiv tabda qolgan vaqt */}
                {activeGroup === g.key && (
                  <span className="absolute top-1 right-1.5 text-[9px] font-mono opacity-60">
                    {switchIn}s
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-muted font-mono text-sm">
            Hali natijalar yo'q
          </div>
        ) : (
          <div className="space-y-3">

            {/* Top 3 podium */}
            {students.length >= 3 && (
              <div className="grid grid-cols-3 items-end gap-3">
                {[students[1], students[0], students[2]].map((s, i) => {
                  const colors = [
                    'border-sub/30 bg-sub/5',
                    'border-accent/40 bg-accent/5',
                    'border-orange-500/30 bg-orange-500/5',
                  ];
                  const heights = ['h-32', 'h-44', 'h-28'];
                  const medals  = ['🥈', '🥇', '🥉'];
                  return (
                    <div key={s.id}
                      className={`${colors[i]} border rounded-xl p-3 text-center flex flex-col
                        items-center justify-end ${heights[i]} transition-all`}
                    >
                      <div className="text-2xl mb-1">{medals[i]}</div>
                      <p className="text-text text-xs font-semibold truncate w-full">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-muted text-xs truncate w-full">{s.school}</p>
                      <p className="text-accent font-mono font-bold text-sm mt-1">
                        {s.totalScore.toFixed(1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border
                text-muted text-xs font-mono uppercase tracking-widest">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Talaba</div>
                <div className="col-span-2 hidden sm:block">Maktab</div>
                <div className="col-span-1 text-center"><Keyboard size={10} className="inline" /></div>
                <div className="col-span-1 text-center"><FileQuestion size={10} className="inline" /></div>
                <div className="col-span-1 text-center"><FileText size={10} className="inline" /></div>
                <div className="col-span-2 text-right">Jami</div>
              </div>

              {students.map((s, i) => (
                <div key={s.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center text-sm
                    ${i !== students.length - 1 ? 'border-b border-border' : ''}
                    ${i < 3 ? 'bg-accent/[0.1]' : ''}`}
                >
                  <div className="col-span-1">
                    {i === 0 ? <Trophy size={18} className="text-yellow-600" />
                      : i === 1 ? <Medal size={18} className="text-gray-600" />
                      : i === 2 ? <Medal size={18} className="text-orange-600" />
                      : <span className="text-muted font-mono text-xs">{i + 1}</span>}
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-text font-medium truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-muted text-xs">{s.grade}-sinf</p>
                  </div>
                  <div className="col-span-2 text-muted text-xs truncate hidden sm:block">{s.school}</div>
                  <div className="col-span-1 text-center font-mono text-xs text-sub">{s.typingScore.toFixed(0)}</div>
                  <div className="col-span-1 text-center font-mono text-xs text-sub">{s.testScore.toFixed(0)}</div>
                  <div className="col-span-1 text-center font-mono text-xs text-sub">{s.docsScore.toFixed(0)}</div>
                  <div className="col-span-2 text-right font-mono font-bold text-accent">
                    {s.totalScore.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/results" className="text-muted text-xs font-mono hover:text-sub transition-colors">
            ← Mening natijalarim
          </Link>
        </div>
      </div>
    </div>
  );
}