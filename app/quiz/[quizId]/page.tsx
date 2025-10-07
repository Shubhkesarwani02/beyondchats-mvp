'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

  useEffect(() => {
    if (!quizId) return;
    
    fetch(`/api/get-quiz?quizId=${quizId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setQuiz(data.quiz);
        } else {
          console.error('Failed to load quiz:', data.error);
        }
      })
      .catch(error => console.error('Error loading quiz:', error));
  }, [quizId]);

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
        alert('Failed to submit quiz: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
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
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h1>
              <div className="text-6xl font-bold mb-4">
                <span className={`${result.percentage >= 70 ? 'text-green-600' : result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </span>
              </div>
              <p className="text-xl text-gray-600">
                {result.totalScore} out of {result.maxScore} points
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Question-by-Question Breakdown</h2>
              {result.perQuestion.map((questionResult, index) => {
                const question = quiz.questions.find(q => q.id === questionResult.questionId);
                if (!question) return null;

                return (
                  <div key={questionResult.questionId} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${questionResult.score === questionResult.maxScore ? 'text-green-600' : questionResult.score > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {questionResult.score}/{questionResult.maxScore}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{question.stem}</p>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">{questionResult.feedback}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setResult(null);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
              <p className="text-gray-600">
                Answered: {getAnsweredCount()}/{quiz.questions.length}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
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
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={isSubmitting || getAnsweredCount() < quiz.questions.length}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>

          {/* Answer Progress */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-4">Question Progress:</p>
            <div className="grid grid-cols-10 gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-8 w-8 rounded text-sm font-medium transition duration-200 ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[quiz.questions[index].id]
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{question.stem}</h2>
        <p className="text-sm text-gray-600 mb-6">Points: {question.maxScore}</p>
      </div>
      
      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <label 
            key={index}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition duration-200 ${
              selectedIndex === index 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name={question.id}
              checked={selectedIndex === index}
              onChange={() => onChange({ selectedIndex: index })}
              className="mr-4 h-4 w-4 text-blue-600"
            />
            <span className="text-gray-900">{option}</span>
          </label>
        ))}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{question.stem}</h2>
        <p className="text-sm text-gray-600 mb-2">Points: {question.maxScore}</p>
        <p className="text-sm text-gray-600 mb-6">
          Expected length: {question.type === 'saq' ? '1-3 sentences' : '4-6 sentences (detailed answer)'}
        </p>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder={`Enter your ${question.type === 'saq' ? 'short' : 'detailed'} answer here...`}
        rows={question.type === 'saq' ? 4 : 8}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      
      <div className="text-sm text-gray-500">
        Character count: {text.length}
      </div>
    </div>
  );
}