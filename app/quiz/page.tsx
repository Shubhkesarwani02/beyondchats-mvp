'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PDFs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Generate New Quiz</h1>

          {/* Quiz Title */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* PDF Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Source PDFs ({form.selectedPdfIds.length} selected)
            </label>
            {pdfs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No PDFs available. Please upload some PDFs first.</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Upload PDFs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {pdfs.map((pdf) => (
                  <label
                    key={pdf.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition duration-200 ${
                      form.selectedPdfIds.includes(pdf.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedPdfIds.includes(pdf.id)}
                      onChange={() => handlePdfToggle(pdf.id)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{pdf.title}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {new Date(pdf.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Configuration */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Multiple Choice Questions
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.num_mcq}
                  onChange={(e) => setForm(prev => ({ ...prev, num_mcq: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Answer Questions
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.num_saq}
                  onChange={(e) => setForm(prev => ({ ...prev, num_saq: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long Answer Questions
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={form.num_laq}
                  onChange={(e) => setForm(prev => ({ ...prev, num_laq: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quiz Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Quiz Summary</h4>
            <p className="text-sm text-gray-600">
              Total Questions: {form.num_mcq + form.num_saq + form.num_laq} 
              {' '}| Estimated Time: {Math.ceil((form.num_mcq * 1 + form.num_saq * 2 + form.num_laq * 5) / 2)} minutes
            </p>
            <p className="text-sm text-gray-600">
              Total Points: {form.num_mcq * 4 + form.num_saq * 4 + form.num_laq * 10}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>

            <button
              onClick={generateQuiz}
              disabled={generating || form.selectedPdfIds.length === 0 || !form.title.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {generating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Quiz...
                </div>
              ) : (
                'Generate Quiz'
              )}
            </button>
          </div>

          {generating && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                🤖 AI is analyzing content from your selected documents and generating personalized questions. This may take 30-60 seconds...
              </p>
              <p className="text-blue-600 text-xs mt-2">
                Questions will be based on the actual content of: {form.selectedPdfIds.length} selected document(s)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}