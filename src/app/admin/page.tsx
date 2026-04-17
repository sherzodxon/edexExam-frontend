'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AdminStudent, TestQuestion, ExamConfig } from '@/types';
import {
  Users, FileQuestion, Settings, Download, Trash2, Plus,
  LogOut, RefreshCw, Check, X, AlertTriangle,
} from 'lucide-react';
import EdexLogo from '@/ui/logo';

// ─────────────────────────────────────────────
// Custom confirm modal
// ─────────────────────────────────────────────
interface ConfirmModalProps {
  message: string;
  sub?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
function ConfirmModal({ message, sub, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm px-4">
      <div className="animate-scale-in bg-surface border border-error/30 rounded-2xl p-6 w-full max-w-xs space-y-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-error" />
          </div>
          <div>
            <p className="text-text font-medium text-sm">{message}</p>
            {sub && <p className="text-sub text-xs mt-1 leading-relaxed">{sub}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="py-2.5 rounded-xl border border-border text-sub text-sm font-mono
              hover:border-muted transition-all disabled:opacity-40"
          >
            Bekor
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="py-2.5 rounded-xl bg-error/10 border border-error/30 text-error text-sm
              font-mono font-semibold hover:bg-error/20 transition-all disabled:opacity-50
              flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <><span className="w-3 h-3 border border-error border-t-transparent rounded-full animate-spin" /> O'chirilmoqda</>
            ) : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = 'results' | 'questions' | 'config';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('results');

  const handleAuth = async () => {
    if (!keyInput.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/config`, {
        headers: { 'x-admin-key': keyInput.trim() },
      });
      if (!res.ok) throw new Error();
      setAdminKey(keyInput.trim());
      setAuthenticated(true);
      setAuthError('');
    } catch {
      setAuthError("Noto'g'ri admin kalit");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="text-center">
            <h1 className="font-mono text-3xl text-accent font-semibold tracking-tight flex items-center text-center justify-center">
           <EdexLogo className="w-12 h-12" />EdEx<span className="text-white">-exam</span>
          </h1>
            <p className="text-muted text-sm mt-2">Admin paneliga kirish</p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-widest">Admin kalit</label>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                placeholder="••••••••"
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 font-mono text-sm text-text
                  placeholder:text-muted outline-none focus:border-accent transition-all"
              />
            </div>
            {authError && <p className="text-error text-xs">{authError}</p>}
            <button
              onClick={handleAuth}
              className="w-full bg-accent text-bg font-mono font-semibold py-3 rounded-xl hover:bg-accent-dim transition-all"
            >
              Kirish →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-mono text-3xl text-accent font-semibold tracking-tight flex items-center text-center justify-center">
           <EdexLogo className="w-12 h-12" />EdEx<span className="text-white">-exam</span>
          </h1>
        <button
          onClick={() => { setAuthenticated(false); setAdminKey(''); setKeyInput(''); }}
          className="flex items-center gap-1.5 text-muted text-xs hover:text-error transition-colors font-mono"
        >
          <LogOut size={12} /> Chiqish
        </button>
      </header>

      <div className="border-b border-border px-6">
        <div className="flex gap-1 -mb-px">
          {([
            { key: 'results', icon: Users, label: 'Natijalar' },
            { key: 'questions', icon: FileQuestion, label: 'Savollar' },
            { key: 'config', icon: Settings, label: 'Sozlamalar' },
          ] as { key: Tab; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-mono border-b-2 transition-all
                ${tab === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-sub'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {tab === 'results'   && <ResultsTab   adminKey={adminKey} />}
        {tab === 'questions' && <QuestionsTab adminKey={adminKey} />}
        {tab === 'config'    && <ConfigTab    adminKey={adminKey} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RESULTS TAB  —  bulk + single delete
// ─────────────────────────────────────────────
function ResultsTab({ adminKey }: { adminKey: string }) {
  const [students,    setStudents]    = useState<AdminStudent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // modal state
  const [modal, setModal] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (gradeFilter) params.grade = gradeFilter;
    if (search)      params.search = search;
    const res = await api.adminGetResults(adminKey, params);
    setStudents(res.data ?? []);
    setSelected(new Set());
    setLoading(false);
  }, [adminKey, gradeFilter, search]);

  useEffect(() => { load(); }, [load]);

  // ── selection helpers ──
  const toggle = (id: number) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const allIds      = students.map(s => s.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(allIds));

  // ── delete helpers ──
  const askDelete = (ids: number[], label: string) => setModal({ ids, label });

  const confirmDelete = async () => {
    if (!modal) return;
    setDeleting(true);
    for (const id of modal.ids) {
      await api.adminDeleteStudent(adminKey, id);
    }
    setStudents(s => s.filter(x => !modal.ids.includes(x.id)));
    setSelected(prev => { const s = new Set(prev); modal.ids.forEach(id => s.delete(id)); return s; });
    setDeleting(false);
    setModal(null);
  };

  // ── download ──
  const handleDownload = (studentId: number) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${base}/api/admin/docs/${studentId}/download`, { headers: { 'x-admin-key': adminKey } })
      .then(r => {
        if (!r.ok) throw new Error();
        const disposition = r.headers.get('Content-Disposition') ?? '';
        const nameMatch   = disposition.match(/filename="?([^"]+)"?/);
        const fileName    = nameMatch ? decodeURIComponent(nameMatch[1]) : 'document.docx';
        return r.blob().then(blob => ({ blob, fileName }));
      })
      .then(({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Fayl yuklab olinmadi'));
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      TYPING:    { label: 'Typing',      cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      TEST:      { label: 'Test',        cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      DOCS:      { label: 'Word',        cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      COMPLETED: { label: 'Yakunlandi', cls: 'bg-accent/10 text-accent border-accent/20' },
    };
    const { label, cls } = cfg[status] ?? { label: status, cls: 'border-border text-muted' };
    return <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
  };

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/export`;

  return (
    <div className="space-y-4">

      {/* ── confirm modal ── */}
      {modal && (
        <ConfirmModal
          message={modal.ids.length === 1 ? "Talabani o'chirish" : `${modal.ids.length} ta talabani o'chirish`}
          sub={modal.label}
          onConfirm={confirmDelete}
          onCancel={() => setModal(null)}
          loading={deleting}
        />
      )}

      {/* ── toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, maktab..."
            className="bg-surface border border-border rounded-xl px-4 py-2 text-sm text-text
              placeholder:text-muted outline-none focus:border-accent transition-all font-mono w-48"
          />
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent font-mono"
          >
            <option value="">Barcha sinflar</option>
            {[5,6,7,8,9,10,11].map(g => <option key={g} value={g}>{g}-sinf</option>)}
          </select>
          <button onClick={load} className="p-2.5 bg-surface border border-border rounded-xl hover:border-muted transition-all">
            <RefreshCw size={14} className="text-muted" />
          </button>

          {/* bulk delete button */}
          {someSelected && (
            <button
              onClick={() => askDelete(
                Array.from(selected),
                `Tanlangan ${selected.size} ta talabaning barcha ma'lumotlari o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
              )}
              className="flex items-center gap-1.5 bg-error/10 border border-error/30 text-error
                px-3 py-2 rounded-xl text-xs font-mono font-semibold hover:bg-error/20 transition-all"
            >
              <Trash2 size={13} /> {selected.size} ta o'chirish
            </button>
          )}
        </div>

        <button
          onClick={() => {
            fetch(exportUrl, { headers: { 'x-admin-key': adminKey } })
              .then(r => r.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'edex-natijalar.xlsx'; a.click();
              });
          }}
          className="flex items-center gap-1.5 bg-accent text-bg px-4 py-2.5 rounded-xl text-sm font-mono font-semibold hover:bg-accent-dim transition-all"
        >
          <Download size={14} /> Excel
        </button>
      </div>

      {/* ── stats ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Jami',         value: students.length },
          { label: 'Yakunladi',    value: students.filter(s => s.status === 'COMPLETED').length },
          { label: "O'rtacha ball",value: students.length ? (students.reduce((a, s) => a + s.totalScore, 0) / students.length).toFixed(1) : '—' },
          { label: 'Test bosqichi',value: students.filter(s => ['TEST','DOCS','COMPLETED'].includes(s.status)).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl px-4 py-3">
            <p className="text-muted text-xs font-mono">{label}</p>
            <p className="text-text font-mono font-bold text-xl mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* ── table ── */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs font-mono uppercase tracking-widest">
                  {/* Select all */}
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                        ${allSelected ? 'bg-accent border-accent' : 'border-border hover:border-muted'}`}
                    >
                      {allSelected && <Check size={10} className="text-bg" />}
                    </button>
                  </th>
                  {['#', 'Ism', 'Maktab', 'Sinf', 'Holat', 'Typing', 'Test', 'Word', 'Jami', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s, i) => {
                  const isSelected = selected.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`transition-colors cursor-pointer
                        ${isSelected ? 'bg-accent/5' : 'hover:bg-bg/50'}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggle(s.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                            ${isSelected ? 'bg-accent border-accent' : 'border-border hover:border-muted'}`}
                        >
                          {isSelected && <Check size={10} className="text-bg" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-text font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-muted text-xs font-mono">{s.token.slice(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-3 text-sub text-xs max-w-[140px] truncate">{s.school}</td>
                      <td className="px-4 py-3 text-sub font-mono text-xs">{s.grade}</td>
                      <td className="px-4 py-3">{statusBadge(s.status)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-sub">{s.typingScore.toFixed(1)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-sub">{s.testScore.toFixed(1)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-sub">{s.docsScore.toFixed(1)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-accent">{s.totalScore.toFixed(1)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {s.docsSubmission && (
                            <button
                              onClick={() => handleDownload(s.id)}
                              title="Word faylni yuklab olish"
                              className="p-1.5 text-muted hover:text-accent transition-colors rounded-lg hover:bg-accent/10"
                            >
                              <Download size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => askDelete(
                              [s.id],
                              `${s.firstName} ${s.lastName} ning barcha ma'lumotlari o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
                            )}
                            className="p-1.5 text-muted hover:text-error transition-colors rounded-lg hover:bg-error/10"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-12 text-muted font-mono text-sm">Natijalar topilmadi</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// QUESTIONS TAB
// ─────────────────────────────────────────────
interface QuestionDraft {
  id: string;
  questionText: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  saving: boolean; saved: boolean; error: string;
}
const emptyDraft = (): QuestionDraft => ({
  id: Math.random().toString(36).slice(2),
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'A', saving: false, saved: false, error: '',
});

function QuestionsTab({ adminKey }: { adminKey: string }) {
  const [questions,    setQuestions]    = useState<TestQuestion[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [viewGrade,    setViewGrade]    = useState(0);
  const [addMode,      setAddMode]      = useState(false);
  const [sessionGrade, setSessionGrade] = useState('0');
  const [drafts,       setDrafts]       = useState<QuestionDraft[]>([emptyDraft()]);
  const [modal,        setModal]        = useState<{ id: number } | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.adminGetQuestions(adminKey, viewGrade || undefined);
    setQuestions(res.data ?? []);
    setLoading(false);
  }, [adminKey, viewGrade]);

  useEffect(() => { load(); }, [load]);

  const updateDraft = (id: string, patch: Partial<QuestionDraft>) =>
    setDrafts(ds => ds.map(d => d.id === id ? { ...d, ...patch } : d));

  const saveDraft = async (draft: QuestionDraft) => {
    if (!draft.questionText.trim() || !draft.optionA.trim() ||
        !draft.optionB.trim() || !draft.optionC.trim() || !draft.optionD.trim()) {
      updateDraft(draft.id, { error: "Barcha maydonlarni to'ldiring" });
      return;
    }
    updateDraft(draft.id, { saving: true, error: '' });
    const res = await api.adminCreateQuestion(adminKey, {
      grade: sessionGrade,
      questionText: draft.questionText,
      optionA: draft.optionA, optionB: draft.optionB,
      optionC: draft.optionC, optionD: draft.optionD,
      correctOption: draft.correctOption,
    });
    if (res.success) {
      setQuestions(q => [res.data, ...q]);
      updateDraft(draft.id, { saving: false, saved: true });
    } else {
      updateDraft(draft.id, { saving: false, error: 'Xato yuz berdi' });
    }
  };

  const saveAll = async () => {
    for (const d of drafts.filter(d => !d.saved)) await saveDraft(d);
  };

  const confirmDelete = async () => {
    if (!modal) return;
    setDeleting(true);
    await api.adminDeleteQuestion(adminKey, modal.id);
    setQuestions(q => q.filter(x => x.id !== modal.id));
    setDeleting(false);
    setModal(null);
  };

  const savedCount = drafts.filter(d => d.saved).length;

  return (
    <div className="space-y-4">

      {modal && (
        <ConfirmModal
          message="Savolni o'chirish"
          sub="Ushbu savol va unga berilgan barcha javoblar o'chiriladi."
          onConfirm={confirmDelete}
          onCancel={() => setModal(null)}
          loading={deleting}
        />
      )}

      {/* toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <select value={viewGrade} onChange={e => setViewGrade(parseInt(e.target.value))}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-accent font-mono">
            <option value={0}>Barcha sinflar</option>
            {[5,6,7,8,9,10,11].map(g => <option key={g} value={g}>{g}-sinf</option>)}
          </select>
          <span className="text-muted text-xs font-mono">{questions.length} ta savol</span>
        </div>
        {!addMode && (
          <button onClick={() => { setDrafts([emptyDraft()]); setSessionGrade('0'); setAddMode(true); }}
            className="flex items-center gap-1.5 bg-accent text-bg px-4 py-2.5 rounded-xl text-sm font-mono font-semibold hover:bg-accent-dim transition-all">
            <Plus size={14} /> Savol qo'shish
          </button>
        )}
      </div>

      {/* add panel */}
      {addMode && (
        <div className="bg-surface border border-accent/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-4">
            <span className="text-xs font-mono text-muted uppercase tracking-widest">Sinf:</span>
            <div className="flex flex-wrap gap-2">
              {[{ v: '0', label: 'Hammasi' }, ...[5,6,7,8,9,10,11].map(g => ({ v: String(g), label: `${g}-sinf` }))].map(({ v, label }) => (
                <button key={v} onClick={() => setSessionGrade(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all
                    ${sessionGrade === v ? 'bg-accent text-bg border-accent' : 'border-border text-muted hover:border-sub hover:text-sub'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-mono text-muted">{savedCount}/{drafts.length} saqlandi</span>
              <button onClick={() => { setAddMode(false); setDrafts([emptyDraft()]); }}
                className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error/10 transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {drafts.map((draft, idx) => (
              <QuestionDraftRow key={draft.id} draft={draft} index={idx}
                onChange={patch => updateDraft(draft.id, patch)}
                onSave={() => saveDraft(draft)}
                onRemove={drafts.length > 1 ? () => setDrafts(ds => ds.filter(d => d.id !== draft.id)) : undefined}
              />
            ))}
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center gap-3">
            <button onClick={() => setDrafts(ds => [...ds, emptyDraft()])}
              className="flex items-center gap-1.5 text-accent text-sm font-mono hover:text-accent-dim transition-colors">
              <Plus size={13} /> Yana savol qo'shish
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { setAddMode(false); setDrafts([emptyDraft()]); }}
                className="px-4 py-2 rounded-xl border border-border text-sub text-sm font-mono hover:border-muted transition-all">
                Yopish
              </button>
              <button onClick={saveAll} disabled={drafts.every(d => d.saved)}
                className="px-5 py-2 bg-accent text-bg rounded-xl text-sm font-mono font-semibold hover:bg-accent-dim transition-all disabled:opacity-40">
                Hammasini saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* questions list */}
      {loading ? (
        <div className="text-center py-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-surface border border-border rounded-xl px-4 py-4 flex gap-3">
              <span className="text-muted font-mono text-xs mt-0.5 shrink-0 w-6">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 justify-between">
                  <p className="text-text text-sm leading-relaxed">{q.questionText}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-mono text-muted bg-bg px-2 py-0.5 rounded border border-border">
                      {q.grade === 0 ? 'Hammasi' : `${q.grade}-sinf`}
                    </span>
                    <button onClick={() => setModal({ id: q.id })}
                      className="p-1.5 text-muted hover:text-error transition-colors rounded-lg hover:bg-error/10">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2.5">
                  {['A','B','C','D'].map(opt => (
                    <div key={opt} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                      ${q.correctOption === opt ? 'bg-accent/10 text-accent font-medium' : 'text-muted'}`}>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                        ${q.correctOption === opt ? 'border-accent bg-accent' : 'border-border'}`}>
                        {q.correctOption === opt && <span className="w-1.5 h-1.5 rounded-full bg-bg block" />}
                      </span>
                      <span className="font-mono font-bold mr-0.5">{opt}.</span>
                      <span className="truncate">{q[`option${opt}` as keyof TestQuestion] as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-12 text-muted font-mono text-sm">Savollar yo'q</div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionDraftRow({ draft, index, onChange, onSave, onRemove }: {
  draft: QuestionDraft; index: number;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onSave: () => void; onRemove?: () => void;
}) {
  const opts: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
  const optKey = (o: string) => `option${o}` as 'optionA'|'optionB'|'optionC'|'optionD';
  return (
    <div className={`px-6 py-5 space-y-4 ${draft.saved ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted">{index + 1}-savol</span>
        {draft.saved && <span className="flex items-center gap-1 text-xs text-accent font-mono"><Check size={11} /> Saqlandi</span>}
        {onRemove && !draft.saved && (
          <button onClick={onRemove} className="ml-auto p-1 text-muted hover:text-error rounded transition-colors"><Trash2 size={12} /></button>
        )}
      </div>
      <textarea value={draft.questionText} onChange={e => onChange({ questionText: e.target.value })}
        disabled={draft.saved} placeholder={`${index + 1}-savol matnini kiriting...`} rows={2}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text
          placeholder:text-muted outline-none focus:border-accent transition-all resize-none disabled:opacity-50" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {opts.map(opt => {
          const isCorrect = draft.correctOption === opt;
          return (
            <div key={opt} onClick={() => !draft.saved && onChange({ correctOption: opt })}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all group
                ${isCorrect ? 'border-accent bg-accent/5' : 'border-border hover:border-sub/50'}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${isCorrect ? 'border-accent' : 'border-border group-hover:border-sub'}`}>
                {isCorrect && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <span className={`font-mono text-xs font-bold shrink-0 w-4 ${isCorrect ? 'text-accent' : 'text-muted'}`}>{opt}</span>
              <input value={draft[optKey(opt)]} onChange={e => { e.stopPropagation(); onChange({ [optKey(opt)]: e.target.value }); }}
                onClick={e => e.stopPropagation()} disabled={draft.saved} placeholder={`${opt} varianti`}
                className="flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-none disabled:opacity-50" />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        {draft.error ? <p className="text-error text-xs">{draft.error}</p> : <div />}
        {!draft.saved && (
          <button onClick={onSave} disabled={draft.saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-bg rounded-lg
              text-xs font-mono font-semibold hover:bg-accent-dim transition-all disabled:opacity-50 ml-auto">
            {draft.saving
              ? <><span className="w-3 h-3 border border-bg border-t-transparent rounded-full animate-spin" /> Saqlanmoqda</>
              : <><Check size={11} /> Saqlash</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIG TAB
// ─────────────────────────────────────────────
function ConfigTab({ adminKey }: { adminKey: string }) {
  const [config,       setConfig]       = useState<Partial<ExamConfig>>({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [criteriaText, setCriteriaText] = useState('');

  useEffect(() => {
    api.adminGetConfig(adminKey).then((res: { data: ExamConfig }) => {
      setConfig(res.data ?? {});
      try { setCriteriaText(JSON.stringify(JSON.parse(res.data?.docsCriteria ?? '{}'), null, 2)); }
      catch { setCriteriaText(''); }
      setLoading(false);
    });
  }, [adminKey]);

  const secToMin = (sec?: number) => sec ? Math.round(sec / 60) : 0;
  const minToSec = (min: number) => min * 60;

  const handleSave = async () => {
    setSaving(true);
    let parsedCriteria;
    try { parsedCriteria = criteriaText ? JSON.parse(criteriaText) : null; }
    catch { alert("Mezon JSON formati noto'g'ri!"); setSaving(false); return; }
    await api.adminUpdateConfig(adminKey, {
      testTimeLimitSec: config.testTimeLimitSec,
      docsTimeLimitSec: config.docsTimeLimitSec,
      docsCriteria: parsedCriteria,
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="text-center py-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h3 className="font-mono text-sm font-semibold text-text">Vaqt limiti</h3>
        <div className="space-y-4">
          {[
            { label: 'Test vaqti', key: 'testTimeLimitSec' as const, max: 180, def: 1200 },
            { label: 'Word yuklash vaqti', key: 'docsTimeLimitSec' as const, max: 300, def: 1800 },
          ].map(({ label, key, max, def }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-widest">{label}</label>
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <input type="number" min={1} max={max}
                    value={secToMin(config[key]) || Math.round(def / 60)}
                    onChange={e => setConfig(c => ({ ...c, [key]: minToSec(parseInt(e.target.value) || 1) }))}
                    className="w-28 bg-bg border border-border rounded-xl pl-4 pr-16 py-2.5 font-mono text-sm text-text outline-none focus:border-accent transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs font-mono pointer-events-none">daqiqa</span>
                </div>
                <span className="text-muted text-xs font-mono">= {config[key] ?? def} soniya</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-mono text-sm font-semibold text-text">Word fayl mezonlari</h3>
          <p className="text-muted text-xs mt-1">JSON formatida. Mezonlar asosida 40 ball taqsimlanadi.</p>
        </div>
        <div className="bg-bg border border-border rounded-xl p-1">
          <textarea value={criteriaText} onChange={e => setCriteriaText(e.target.value)} rows={14}
            className="w-full bg-transparent font-mono text-xs text-text placeholder:text-muted/50 outline-none resize-none px-3 py-2 leading-relaxed" />
        </div>
        <p className="text-muted text-xs font-mono">keyword — so'z qidiradi | minWords — minimal so'z soni | label — ko'rsatiladigan nom</p>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-accent text-bg font-mono font-semibold px-6 py-3 rounded-xl hover:bg-accent-dim transition-all disabled:opacity-50">
        {saved ? <><Check size={14} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </div>
  );
}
