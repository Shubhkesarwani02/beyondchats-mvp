"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar, CircularProgress } from '@/components/ui/progress';
import ProgressChart from '@/components/ProgressChart';
import StrengthList from '@/components/StrengthList';

interface QuizAttempt {
	id: string; title: string; date: string; percentage: number; score: number; maxScore: number;
}
interface TopicStat { topic: string; avgScore: number; attempts: number; totalScore: number; maxScore: number; }
interface ApiAttempt { id: string; quizTitle: string; score: number; maxScore: number; percentage: number; finishedAt: string; }

export default function DashboardPage() {
	const [loading, setLoading] = useState(true);
	const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
		const [topicStats, setTopicStats] = useState<TopicStat[]>([]);

		useEffect(() => {
			let isMounted = true;
			const load = async () => {
				try {
					setLoading(true);
					const res = await fetch('/api/progress?userId=default-user');
					const json = await res.json();
					if (!isMounted) return;
					if (json.success) {
									setAttempts(json.data.recentAttempts.map((a: ApiAttempt) => ({
							id: a.id,
							title: a.quizTitle,
							date: a.finishedAt?.split('T')[0] || '',
							percentage: a.percentage,
							score: a.score || 0,
							maxScore: a.maxScore || 0,
						})));
						setTopicStats(json.data.topics);
					}
				} catch (e) {
					console.error('Failed to load progress', e);
				} finally {
					if (isMounted) setLoading(false);
				}
			};
			load();
			return () => { isMounted = false; };
		}, []);

	const avg = attempts.length ? Math.round(attempts.reduce((a,c)=>a+c.percentage,0)/attempts.length) : 0;
	const totalQuizzes = attempts.length;
	const recent = attempts[attempts.length-1];

	return (
		<div className="max-w-7xl mx-auto px-6 py-10">
			<div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight gradient-text mb-2">Learning Dashboard</h1>
					<p className="text-sm text-[var(--color-text-muted)]">Overview of your study performance and progress trends.</p>
				</div>
				{!loading && (
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-3">
							<CircularProgress value={avg} />
							<div className="text-xs text-[var(--color-text-muted)] leading-tight w-28">Average quiz score</div>
						</div>
					</div>
				)}
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
				<Card interactive>
					<CardContent className="pt-5 pb-5">
						<p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Quizzes Taken</p>
						<h3 className="text-2xl font-semibold">{loading ? '—' : totalQuizzes}</h3>
					</CardContent>
				</Card>
				<Card interactive>
					<CardContent className="pt-5 pb-5">
						<p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Avg Score</p>
						<h3 className="text-2xl font-semibold">{loading ? '—' : avg + '%'}</h3>
						<ProgressBar value={avg} className="mt-3" />
					</CardContent>
				</Card>
				<Card interactive>
					<CardContent className="pt-5 pb-5">
						<p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Best Recent</p>
						<h3 className="text-xl font-semibold">{loading || !recent ? '—' : recent.percentage + '%'}</h3>
						<p className="text-[10px] uppercase text-[var(--color-text-muted)] mt-1 line-clamp-1">{recent?.title || ''}</p>
					</CardContent>
				</Card>
				<Card interactive>
					<CardContent className="pt-5 pb-5">
						<p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Consistency</p>
						<h3 className="text-xl font-semibold">{loading ? '—' : attempts.length >= 3 ? 'Improving' : 'Collecting'}</h3>
						<p className="text-[10px] text-[var(--color-text-muted)] mt-1">Last {attempts.length} quizzes</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
				{/* Charts Section */}
				<div className="xl:col-span-2 space-y-10">
					<Card>
						<CardHeader>
							<CardTitle>Performance Trend</CardTitle>
							<CardDescription>Scores across your recent quizzes</CardDescription>
						</CardHeader>
						<CardContent>
											{loading ? <div className="h-72 animate-pulse rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)]" /> : attempts.length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">No attempts yet.</p> : (
								<ProgressChart data={attempts.map(a => ({ quizTitle: a.title, percentage: a.percentage, score: a.score, maxScore: a.maxScore, date: a.date }))} type="line" />
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Score Distribution</CardTitle>
							<CardDescription>How your scores cluster by performance band</CardDescription>
						</CardHeader>
						<CardContent>
											{loading ? <div className="h-72 animate-pulse rounded-xl bg-[var(--color-bg-alt)] border border-[var(--color-border)]" /> : attempts.length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">No data yet.</p> : (
								<ProgressChart data={attempts.map(a => ({ quizTitle: a.title, percentage: a.percentage, score: a.score, maxScore: a.maxScore, date: a.date }))} type="pie" />
							)}
						</CardContent>
					</Card>
				</div>

				{/* Topic Performance */}
				<div className="space-y-10">
					<Card>
						<CardHeader>
							<CardTitle>Recent Quizzes</CardTitle>
							<CardDescription>Your latest attempts at a glance</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{loading ? (
								<div className="space-y-3">
									{Array.from({ length: 3 }).map((_,i) => <div key={i} className="h-14 rounded-lg border border-[var(--color-border)] animate-pulse" />)}
								</div>
							) : attempts.map(a => (
								<div key={a.id} className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-alt)] transition">
									<div className="w-14 text-center">
										<div className="text-sm font-semibold">{a.percentage}%</div>
										<div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Score</div>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium line-clamp-1">{a.title}</p>
										<p className="text-[11px] text-[var(--color-text-muted)]">{new Date(a.date).toLocaleDateString()}</p>
									</div>
									<Badge variant={a.percentage >= 85 ? 'success' : a.percentage >= 70 ? 'default' : a.percentage >= 50 ? 'warning' : 'danger'}>
										{a.percentage >= 85 ? 'High' : a.percentage >= 70 ? 'Good' : a.percentage >= 50 ? 'Fair' : 'Low'}
									</Badge>
								</div>
							))}
						</CardContent>
					</Card>

					<div>
						{loading ? (
							<div className="h-80 animate-pulse rounded-xl border border-[var(--color-border)]" />
						) : (
							<StrengthList topics={topicStats} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
