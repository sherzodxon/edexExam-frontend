'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Keyboard, FileQuestion, FileText } from 'lucide-react';
import Link from 'next/link';

type Group = '5-6' | '7-8' | '9-11';

interface LeaderboardData {
  [key: string]: {
    label: string;
    students: LeaderboardEntry[];
  };
}

const GROUP_LABELS: { key: Group; label: string; grades: string }[] = [
  { key: '5-6', label: '5–6-sinf', grades: '5 va 6-sinf o\'quvchilari' },
  { key: '7-8', label: '7–8-sinf', grades: '7 va 8-sinf o\'quvchilari' },
  { key: '9-11', label: '9–11-sinf', grades: '9, 10 va 11-sinf o\'quvchilari' },
];

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group>('5-6');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard()
      .then((res: unknown) => {
        setData((res as { data: LeaderboardData }).data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const students = data?.[activeGroup]?.students ?? [];

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] grid-bg" />
      <div className="max-w-4xl mx-auto w-full space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy size={28} className="text-accent" />
            <h1 className="text-2xl font-semibold text-text font-mono">Reyting</h1>
          </div>
          <p className="text-sub text-sm">Eng yaxshi natijalar</p>
        </div>

        {/* Group tabs */}
        <div className="flex gap-2 p-1 bg-surface border border-border rounded-xl">
          {GROUP_LABELS.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-medium transition-all
                ${activeGroup === g.key
                  ? 'bg-accent text-bg'
                  : 'text-muted hover:text-sub'}`}
            >
              {g.label}
            </button>
          ))}
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
          <div className="space-y-2">
            {/* Top 3 podium */}
            {students.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[students[1], students[0], students[2]].map((s, i) => {
                  const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const colors = ['border-sub/30 bg-sub/5', 'border-accent/40 bg-accent/5', 'border-orange-500/30 bg-orange-500/5'];
                  return (
                    <div key={s.id} className={`${colors[i]} border rounded-xl p-3 text-center flex flex-col items-center justify-end ${heights[i]}`}>
                      <div className="text-2xl mb-1">{['🥈', '🥇', '🥉'][i]}</div>
                      <p className="text-text text-xs font-semibold truncate w-full">{s.firstName} {s.lastName}</p>
                      <p className="text-muted text-xs truncate w-full">{s.school}</p>
                      <p className="text-accent font-mono font-bold text-sm mt-1">{s.totalScore.toFixed(1)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-muted text-xs font-mono uppercase tracking-widest">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Talaba</div>
                <div className="col-span-2 text-center hidden sm:block">Maktab</div>
                <div className="col-span-1 text-center"><Keyboard size={10} className="inline" /></div>
                <div className="col-span-1 text-center"><FileQuestion size={10} className="inline" /></div>
                <div className="col-span-1 text-center"><FileText size={10} className="inline" /></div>
                <div className="col-span-2 text-right">Jami</div>
              </div>

              {students.map((s, i) => (
                <div key={s.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center text-sm
                    ${i !== students.length - 1 ? 'border-b border-border' : ''}
                    ${i < 3 ? 'bg-accent/[0.02]' : ''}`}
                >
                  <div className="col-span-1">
                    {i === 0 ? <Trophy size={14} className="text-yellow-400" />
                      : i === 1 ? <Medal size={14} className="text-gray-400" />
                      : i === 2 ? <Medal size={14} className="text-orange-400" />
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
