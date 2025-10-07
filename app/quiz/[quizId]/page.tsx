'use client';

import { useState, useEffect, useMemo } from 'react';
import { ScoreRadial } from '@/components/ui/ScoreRadial';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface Answer {
  selectedIndex?: number;
  text?: string;
}

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'saq' | 'laq';
  stem: string;
  maxScore: number;
  options?: string[];
  explanation?: string;
  source?: Array<{ pdfId: string; page: number; snippet: string }>;
  topic?: string; // derived client-side for remediation grouping
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

interface QuestionScore {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface SubmissionResult {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  perQuestion: QuestionScore[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  const { show } = useToast();

  // Prepare mastery summary early (must appear before any early returns for hook rules)
  const mastery = useMemo(() => {
    if (!quiz || !result) return { strengths: [], weaknesses: [] };
    const strengths: { id: string; scorePct: number; stem: string }[] = [];
    const weaknesses: { id: string; scorePct: number; stem: string }[] = [];
    for (const qr of result.perQuestion) {
      const q = quiz.questions.find(qq => qq.id === qr.questionId);
      if (!q) continue;
      const pct = (qr.score / qr.maxScore) * 100;
      (pct >= 70 ? strengths : weaknesses).push({ id: qr.questionId, scorePct: pct, stem: q.stem.slice(0, 80) });
    }
    return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) };
  }, [quiz, result]);

  useEffect(() => {
    if (!quizId) return;
    
    fetch(`/api/get-quiz?quizId=${quizId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // derive topic heuristically from stem (simple placeholder) until backend adds taxonomy
          interface IncomingQuestion { id:string; type:'mcq'|'saq'|'laq'; stem:string; maxScore:number; options?:string[]; explanation?:string; source?: Array<{ pdfId:string; page:number; snippet:string }>; }
          const quizWithTopics: Quiz = {
            ...data.quiz,
            questions: (data.quiz.questions as IncomingQuestion[]).map((q) => ({
              ...q,
              topic: deriveTopic(q.stem)
            }))
          };
          setQuiz(quizWithTopics);
        } else {
          console.error('Failed to load quiz:', data.error);
          show({ type: 'error', message: 'Failed to load quiz.' });
        }
      })
      .catch(error => { console.error('Error loading quiz:', error); show({ type: 'error', message: 'Network error loading quiz.' }); });
  }, [quizId, show]);

  const handleAnswerChange = (questionId: string, answer: Answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        quizId,
        userId: 'user_demo', // Replace with actual user ID from auth
        answers: quiz.questions.map(q => {
          const answer = answers[q.id] || {};
          if (q.type === 'mcq') {
            return {
              questionId: q.id,
              type: 'mcq' as const,
              selectedIndex: answer.selectedIndex
            };
          }
          return {
            questionId: q.id,
            type: q.type,
            text: answer.text || ''
          };
        })
      };

      const response = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        setResult(result);
        setShowResults(true);
      } else {
        console.error('Submission failed:', result.error);
        show({ type: 'error', message: 'Quiz submission failed: ' + result.error });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      show({ type: 'error', message: 'Unexpected error submitting quiz.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }


  if (showResults && result) {
    const filteredPerQuestion = showIncorrectOnly
      ? result.perQuestion.filter(qr => qr.score < qr.maxScore)
      : result.perQuestion;
    const incorrectCount = result.perQuestion.filter(qr => qr.score < qr.maxScore).length;
    const shareText = encodeURIComponent(`I scored ${result.percentage}% (${result.totalScore}/${result.maxScore}) on a quiz!`);
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 items-start animate-fade-in-scale">
            {/* Score Panel */}
            <div className="md:col-span-1 flex flex-col items-center bg-[var(--color-bg-alt)] border border-[var(--color-border)] rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_20%,#6366f1,transparent_60%)]" />
              <ScoreRadial value={result.percentage} label="Score" subtitle={`${result.totalScore}/${result.maxScore} pts`} />
              <div className="mt-6 w-full space-y-3">
                <PerformanceBar label="Accuracy" value={result.percentage} />
                <PerformanceBar label="Completion" value={100} />
              </div>
              <div className="mt-8 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">Attempt ID: <span className="font-medium text-[var(--color-text)]">{result.attemptId.slice(0,8)}</span></p>
              </div>
              <div className="mt-10 flex flex-col gap-3 w-full">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white font-medium shadow hover:shadow-md transition"
                >Dashboard</button>
                <button
                  onClick={() => {
                    setShowResults(false); setResult(null); setAnswers({}); setCurrentQuestionIndex(0);
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] font-medium"
                >Retake</button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Quiz Score: ${result.percentage}% ( ${result.totalScore}/${result.maxScore} )`);
                    show({ type: 'success', message: 'Summary copied!' });
                  }}
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] hover:bg-[var(--color-bg)] text-sm"
                >Copy Summary</button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="h-11 rounded-xl border border-[var(--color-border)] flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] text-sm"
                >Share ↗</a>
              </div>
            </div>

            {/* Breakdown */}
            <div className="md:col-span-2 space-y-10">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-semibold tracking-tight gradient-text">Question Breakdown</h2>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <button onClick={() => setShowIncorrectOnly(v => !v)} className={`px-3 h-8 rounded-full border transition ${showIncorrectOnly ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-bg-alt)]'}`}>
                      {showIncorrectOnly ? 'Showing Incorrect Only' : 'Review Incorrect Only'}
                      {showIncorrectOnly && <span className="ml-2 text-[10px] font-semibold">{incorrectCount}</span>}
                    </button>
                    <span className="px-3 h-8 rounded-full border border-[var(--color-border)] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Full
                      <span className="h-2 w-2 rounded-full bg-indigo-500" /> High
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Partial
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Wrong
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredPerQuestion.map((qr, idx) => {
                    const question = quiz.questions.find(q => q.id === qr.questionId);
                    if (!question) return null;
                    const pct = (qr.score / qr.maxScore) * 100;
                    return (
                      <div key={qr.questionId} className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur-sm p-5 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-500/5 via-fuchsia-500/5 to-pink-500/5" />
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="flex flex-col items-center w-10 pt-1">
                            <span className="text-[10px] font-semibold tracking-wide text-[var(--color-text-muted)]">Q{idx + 1}</span>
                            <ScoreMini value={pct} size={40} />
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="text-sm font-medium leading-snug">{question.stem}</p>
                            {question.topic && <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Topic: <span className="text-[var(--color-text)] font-semibold">{question.topic}</span></p>}
                            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                              <div className={`h-full ${pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-indigo-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] italic">{qr.feedback}</p>
                          </div>
                          <div className="w-14 text-right flex flex-col items-end">
                            <span className={`text-sm font-semibold ${pct === 100 ? 'text-emerald-600' : pct >= 70 ? 'text-indigo-600' : pct > 0 ? 'text-amber-600' : 'text-red-600'}`}>{qr.score}/{qr.maxScore}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{Math.round(pct)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)] mb-4">Top Strengths</h3>
                  <ul className="space-y-3">
                    {mastery.strengths.length === 0 && <li className="text-xs text-[var(--color-text-muted)]">No high-performing items yet.</li>}
                    {mastery.strengths.map(s => (
                      <li key={s.id} className="text-sm flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />{s.stem} <span className="ml-auto text-xs text-emerald-600 font-medium">{Math.round(s.scorePct)}%</span></li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6">
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)] mb-4">Key Remediations</h3>
                  <ul className="space-y-3">
                    {mastery.weaknesses.length === 0 && <li className="text-xs text-[var(--color-text-muted)]">No weak items detected.</li>}
                    {mastery.weaknesses.map(w => (
                      <li key={w.id} className="text-sm flex items-start gap-2"><span className="h-2 w-2 rounded-full bg-red-500 mt-1" />
                        <div className="flex-1">
                          {w.stem}<div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Review source material & attempt a targeted practice.</div>
                        </div>
                        <span className="ml-2 text-xs text-red-600 font-medium">{Math.round(w.scorePct)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Shareable Summary Card */}
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Shareable Summary</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">You can share this performance snapshot or copy the summary for your learning journal. Tracking progress over attempts helps reinforce long-term retention.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    const png = createShareImage(result.percentage, result.totalScore, result.maxScore);
                    png.then(url => {
                      const a = document.createElement('a'); a.href = url; a.download = 'quiz-summary.png'; a.click();
                      show({ type: 'success', message: 'Image downloaded' });
                    }).catch(() => show({ type: 'error', message: 'Failed generating image' }));
                  }} className="px-4 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 text-white text-xs font-medium shadow hover:shadow-md">Download Image</button>
                  <button onClick={() => { navigator.clipboard.writeText(`Score ${result.percentage}% (${result.totalScore}/${result.maxScore}). Strength topics: ${mastery.strengths.map(s=>s.stem).join('; ')}`); show({ type: 'success', message: 'Copied summary' }); }} className="px-4 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] text-xs font-medium">Copy Text</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10">
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-sm p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500" />
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-2 gradient-text">{quiz.title}</h1>
            <div className="flex justify-between items-center text-sm">
              <p className="text-[var(--color-text-muted)]">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
              <p className="text-[var(--color-text-muted)]">Answered: {getAnsweredCount()}/{quiz.questions.length}</p>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--color-border)]/60 mt-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }} />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <QuestionRenderer 
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-5 h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white font-medium shadow hover:shadow-md transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={isSubmitting || getAnsweredCount() < quiz.questions.length}
                  className="px-8 h-11 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>

          {/* Answer Progress */}
          <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-3">Quick Jump</p>
            <div className="grid grid-cols-10 gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all border ${index === currentQuestionIndex ? 'bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white border-transparent shadow' : answers[quiz.questions[index].id] ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRenderer({ 
  question, 
  answer, 
  onChange 
}: { 
  question: QuizQuestion; 
  answer: Answer; 
  onChange: (answer: Answer) => void; 
}) {
  if (question.type === 'mcq') {
    return <MCQRenderer question={question} answer={answer} onChange={onChange} />;
  } else {
    return <TextQuestionRenderer question={question} answer={answer} onChange={onChange} />;
  }
}

function MCQRenderer({ 
  question, 
  answer, 
  onChange 
}: { 
  question: QuizQuestion; 
  answer: Answer; 
  onChange: (answer: Answer) => void; 
}) {
  const selectedIndex = answer?.selectedIndex;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3 leading-snug">{question.stem}</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Points: {question.maxScore}</p>
      </div>
      <div className="space-y-2">
        {question.options?.map((option, index) => {
          const active = selectedIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange({ selectedIndex: index })}
              className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all relative overflow-hidden ${active ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)]'}`}
            >
              <span className="relative z-10">{option}</span>
              {active && <span className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-fuchsia-500/5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextQuestionRenderer({ 
  question, 
  answer, 
  onChange 
}: { 
  question: QuizQuestion; 
  answer: Answer; 
  onChange: (answer: Answer) => void; 
}) {
  const text = answer?.text || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3 leading-snug">{question.stem}</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Points: {question.maxScore}</p>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Expected length: {question.type === 'saq' ? '1-3 sentences' : '4-6 sentences (detailed answer)'}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={`Enter your ${question.type === 'saq' ? 'short' : 'detailed'} answer here...`}
        rows={question.type === 'saq' ? 4 : 8}
        className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm"
      />
      <div className="text-[10px] tracking-wide uppercase text-[var(--color-text-muted)]">Characters: {text.length}</div>
    </div>
  );
}

function PerformanceBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-indigo-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-xs font-medium text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

function ScoreMini({ value, size = 40 }: { value: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? '#10b981' : pct >= 70 ? '#6366f1' : pct > 0 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="overflow-visible">
      <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${circ - dash}`}
      />
    </svg>
  );
}

// Heuristic topic derivation (placeholder). Could be replaced by server-provided taxonomy.
function deriveTopic(stem: string): string {
  const lower = stem.toLowerCase();
  if (/(neural|network|backprop|gradient)/.test(lower)) return 'Neural Networks';
  if (/(token|embedding|transformer|attention)/.test(lower)) return 'NLP / Transformers';
  if (/(regression|classifier|classification|accuracy|precision|recall)/.test(lower)) return 'Model Evaluation';
  if (/(vector|similarity|cosine)/.test(lower)) return 'Vector Search';
  if (/(database|sql|schema)/.test(lower)) return 'Data Storage';
  return 'General';
}

// Generate a simple shareable PNG using Canvas API
async function createShareImage(pct: number, total: number, max: number): Promise<string> {
  const canvas = document.createElement('canvas');
  const w = 800; const h = 420; canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // background
  const grad = ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,'#ffffff'); grad.addColorStop(1,'#f1f5f9');
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  // title
  ctx.fillStyle = '#111827';
  ctx.font = '700 42px system-ui';
  ctx.fillText('Quiz Performance', 40, 80);
  // score circle
  const centerX = 150; const centerY = 230; const radius = 100;
  ctx.lineWidth = 18; ctx.strokeStyle = '#e5e7eb'; ctx.beginPath(); ctx.arc(centerX,centerY,radius,0,Math.PI*2); ctx.stroke();
  const angle = (pct/100)*Math.PI*2;
  const grad2 = ctx.createLinearGradient(centerX-radius,centerY,centerX+radius,centerY);
  grad2.addColorStop(0,'#6366f1'); grad2.addColorStop(0.6,'#8b5cf6'); grad2.addColorStop(1,'#ec4899');
  ctx.strokeStyle = grad2; ctx.beginPath(); ctx.arc(centerX,centerY,radius,-Math.PI/2,angle-Math.PI/2); ctx.stroke();
  ctx.fillStyle = '#111827'; ctx.font = '600 48px system-ui'; ctx.textAlign='center'; ctx.fillText(`${Math.round(pct)}%`, centerX, centerY+18);
  ctx.font='400 18px system-ui'; ctx.fillStyle='#4b5563'; ctx.fillText(`${total}/${max} pts`, centerX, centerY+48);
  // details
  ctx.textAlign='left'; ctx.font='600 24px system-ui'; ctx.fillStyle='#111827'; ctx.fillText('Highlights', 360, 140);
  ctx.font='400 18px system-ui'; ctx.fillStyle='#4b5563';
  ctx.fillText('• Accuracy: '+Math.round(pct)+'%', 360, 190);
  ctx.fillText('• Total Points: '+total+' / '+max, 360, 220);
  ctx.fillText('• Generated at: '+ new Date().toLocaleString(), 360, 250);
  ctx.font='400 14px system-ui'; ctx.fillText('Generated by BeyondChats', 40, h-40);
  return canvas.toDataURL('image/png');
}