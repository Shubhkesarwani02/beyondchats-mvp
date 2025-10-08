'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PDF {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

interface GenerateQuizForm {
  title: string;
  selectedPdfIds: string[];
  num_mcq: number;
  num_saq: number;
  num_laq: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function QuizGeneratorPage() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<GenerateQuizForm>({
    title: '',
    selectedPdfIds: [],
    num_mcq: 6,
    num_saq: 3,
    num_laq: 1,
    difficulty: 'medium'
  });

  useEffect(() => {
    // Fetch available PDFs
    fetch('/api/pdfs')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPdfs(data.pdfs);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching PDFs:', error);
        setLoading(false);
      });
  }, []);

  const handlePdfToggle = (pdfId: string) => {
    setForm(prev => ({
      ...prev,
      selectedPdfIds: prev.selectedPdfIds.includes(pdfId)
        ? prev.selectedPdfIds.filter(id => id !== pdfId)
        : [...prev.selectedPdfIds, pdfId]
    }));
  };

  const generateQuiz = async () => {
    if (form.selectedPdfIds.length === 0) {
      alert('Please select at least one PDF');
      return;
    }

    if (!form.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          pdfIds: form.selectedPdfIds,
          num_mcq: form.num_mcq,
          num_saq: form.num_saq,
          num_laq: form.num_laq,
          difficulty: form.difficulty
        })
      });

      const result = await response.json();
      if (response.ok) {
        // Redirect to the generated quiz
        router.push(`/quiz/${result.quizId}`);
      } else {
        alert('Failed to generate quiz: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error generating quiz');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 rounded-full border-2 border-indigo-500 border-b-transparent" /></div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight gradient-text mb-2">Generate New Quiz</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Combine multiple PDFs to create a tailored assessment.</p>
          </div>
          <Button onClick={generateQuiz} disabled={generating || form.selectedPdfIds.length === 0 || !form.title.trim()} className="hidden lg:inline-flex">
            {generating ? 'Generating…' : 'Generate Quiz'}
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Basics</CardTitle>
                <CardDescription>Name and choose document sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold tracking-wide mb-2 uppercase text-[var(--color-text-muted)]">Quiz Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Chapter 2 Concept Check" className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide mb-3 uppercase text-[var(--color-text-muted)]">Select Source PDFs ({form.selectedPdfIds.length} selected)</label>
                  {pdfs.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-sm text-[var(--color-text-muted)]">
                      <p>No PDFs available. Upload from the Upload page.</p>
                      <Button onClick={() => router.push('/upload')} variant="subtle" className="mt-4">Upload PDFs</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-60 sm:max-h-72 overflow-y-auto pr-1 mobile-scroll">
                      {pdfs.map(pdf => {
                        const active = form.selectedPdfIds.includes(pdf.id);
                        return (
                          <button key={pdf.id} type="button" onClick={() => handlePdfToggle(pdf.id)} className={`group relative rounded-xl border p-3 sm:p-4 text-left transition-all touch-target ${active ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)]'}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-sm leading-snug line-clamp-2 flex-1 text-responsive">{pdf.title}</p>
                              {active && <Badge variant="success">Selected</Badge>}
                            </div>
                            <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{new Date(pdf.createdAt).toLocaleDateString()}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Adjust question counts & difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  <ConfigNumber label="MCQs" value={form.num_mcq} onChange={(v) => setForm(p => ({ ...p, num_mcq: v }))} max={20} />
                  <ConfigNumber label="SAQs" value={form.num_saq} onChange={(v) => setForm(p => ({ ...p, num_saq: v }))} max={10} />
                  <ConfigNumber label="LAQs" value={form.num_laq} onChange={(v) => setForm(p => ({ ...p, num_laq: v }))} max={5} />
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold tracking-wide mb-2 uppercase text-[var(--color-text-muted)]">Difficulty</label>
                    <select value={form.difficulty} onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))} className="w-full px-2 sm:px-3 py-2 sm:py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 sm:space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm"><span>Total Questions</span><span className="font-semibold">{form.num_mcq + form.num_saq + form.num_laq}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Estimated Time</span><span className="font-semibold">{Math.ceil((form.num_mcq * 1 + form.num_saq * 2 + form.num_laq * 5) / 2)} mins</span></div>
                <div className="flex items-center justify-between text-sm"><span>Total Points</span><span className="font-semibold">{form.num_mcq * 4 + form.num_saq * 4 + form.num_laq * 10}</span></div>
                <div className="pt-2">
                  <Button onClick={generateQuiz} disabled={generating || form.selectedPdfIds.length === 0 || !form.title.trim()} className="w-full">
                    {generating ? 'Generating…' : 'Generate Quiz'}
                  </Button>
                </div>
                {generating && (
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">AI analyzing selected documents…</p>
                )}
              </CardContent>
            </Card>
            
            {/* Mobile action button */}
            <div className="lg:hidden">
              <Button onClick={generateQuiz} disabled={generating || form.selectedPdfIds.length === 0 || !form.title.trim()} className="w-full">
                {generating ? 'Generating…' : 'Generate Quiz'}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ConfigNumber({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide mb-2 uppercase text-[var(--color-text-muted)]">{label}</label>
      <input type="number" min={0} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className="w-full px-2 sm:px-3 py-2 sm:py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
    </div>
  );
}