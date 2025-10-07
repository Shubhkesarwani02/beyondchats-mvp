'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
  numMcq: number;
  numSaq: number;
  numLaq: number;
}

interface PDF {
  id: string;
  title: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/quizzes').then(r => r.json()),
      fetch('/api/pdfs').then(r => r.json())
    ]).then(([quizzesData, pdfsData]) => {
      if (quizzesData.success) setQuizzes(quizzesData.quizzes);
      if (pdfsData.success) setPdfs(pdfsData.pdfs);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your PDFs, quizzes, and track your learning progress</p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => router.push('/upload')}
            className="bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-200 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload PDF</h3>
                <p className="text-gray-600 text-sm">Add new documents</p>
              </div>
              <div className="text-blue-500">📄</div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/quiz')}
            className="bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-200 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Quiz</h3>
                <p className="text-gray-600 text-sm">Create AI quizzes</p>
              </div>
              <div className="text-green-500">🧠</div>
            </div>
          </div>

          <div 
            onClick={() => router.push('/chat')}
            className="bg-white shadow-lg rounded-lg p-6 cursor-pointer hover:shadow-xl transition duration-200 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chat with PDFs</h3>
                <p className="text-gray-600 text-sm">Ask questions</p>
              </div>
              <div className="text-purple-500">💬</div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                <p className="text-gray-600 text-sm">Track learning</p>
              </div>
              <div className="text-yellow-500">📊</div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Quizzes */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Quizzes</h2>
              <button
                onClick={() => router.push('/quiz')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm"
              >
                Create New
              </button>
            </div>
            
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No quizzes created yet</p>
                <button
                  onClick={() => router.push('/quiz')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Generate Your First Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.slice(0, 5).map((quiz) => (
                  <div 
                    key={quiz.id}
                    onClick={() => router.push(`/quiz/${quiz.id}`)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {quiz.numMcq} MCQ • {quiz.numSaq} SAQ • {quiz.numLaq} LAQ
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {quiz.questionCount} questions
                        </div>
                        <div className="text-xs text-gray-500">
                          {quiz.attemptCount} attempts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {quizzes.length > 5 && (
                  <button
                    onClick={() => router.push('/quiz')}
                    className="w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View All Quizzes ({quizzes.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Uploaded PDFs */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your PDFs</h2>
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm"
              >
                Upload New
              </button>
            </div>
            
            {pdfs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No PDFs uploaded yet</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Upload Your First PDF
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pdfs.slice(0, 5).map((pdf) => (
                  <div 
                    key={pdf.id}
                    onClick={() => router.push(`/reader/${pdf.id}`)}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-red-500 mr-3">📄</div>
                        <div>
                          <h3 className="font-medium text-gray-900">{pdf.title}</h3>
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(pdf.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400">→</div>
                    </div>
                  </div>
                ))}
                {pdfs.length > 5 && (
                  <button
                    onClick={() => router.push('/upload')}
                    className="w-full text-center py-2 text-green-600 hover:text-green-700 text-sm"
                  >
                    View All PDFs ({pdfs.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{pdfs.length}</div>
              <div className="text-sm text-gray-600">PDFs Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{quizzes.length}</div>
              <div className="text-sm text-gray-600">Quizzes Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {quizzes.reduce((sum, quiz) => sum + quiz.attemptCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Quiz Attempts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}