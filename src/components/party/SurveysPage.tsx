import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import AIInsightBanner from './AIInsightBanner';
import {
  ClipboardList, CheckCircle2, Clock, ArrowRight, Send,
  ChevronDown, ChevronUp, BarChart3, PieChart as PieIcon,
  TrendingUp, FileText, Sparkles, RefreshCw, MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { api } from '@/lib/api';

type BackendSurvey = {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

type BackendSurveyQuestion = {
  _id: string;
  survey: string;
  type: 'text' | 'mcq';
  prompt: string;
  options: string[];
  order: number;
};

type QuestionAnalytics = {
  type: 'text' | 'mcq';
  prompt: string;
  results?: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;
  samples?: string[];
};

type SurveyAnalyticsData = {
  survey: BackendSurvey;
  totalResponses: number;
  byQuestion: Record<string, QuestionAnalytics>;
};

const CHART_COLORS = [
  '#2563eb', // Blue
  '#eab308', // Yellow
  '#16a34a', // Green
  '#dc2626', // Red
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
];

const SurveysPage: React.FC = () => {
  const { isAuthenticated, setShowLoginModal } = useAppContext();
  const [surveys, setSurveys] = useState<BackendSurvey[]>([]);
  const [questionsBySurveyId, setQuestionsBySurveyId] = useState<Record<string, BackendSurveyQuestion[]>>({});
  const [loading, setLoading] = useState(false);
  const [submittingSurveyId, setSubmittingSurveyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [analyticsData, setAnalyticsData] = useState<Record<string, SurveyAnalyticsData>>({});
  const [viewingAnalyticsId, setViewingAnalyticsId] = useState<string | null>(null);
  const [chartTypes, setChartTypes] = useState<Record<string, 'bar' | 'pie'>>({});

  const fetchSurveys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.request<{ ok: true; items: BackendSurvey[] }>('/api/surveys', 'GET');
      setSurveys(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResponses = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.authedRequest<{ ok: true; submittedMap: Record<string, boolean> }>('/api/surveys/my-responses', 'GET');
      if (res.submittedMap) {
        setSubmitted((prev) => ({ ...prev, ...res.submittedMap }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchSurveys();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyResponses();
    }
  }, [isAuthenticated]);

  const loadSurveyAnalytics = async (surveyId: string) => {
    try {
      const res = await api.authedRequest<{ ok: true; survey: BackendSurvey; totalResponses: number; byQuestion: Record<string, QuestionAnalytics> }>(
        `/api/surveys/${surveyId}/analytics`,
        'GET'
      );
      setAnalyticsData((prev) => ({
        ...prev,
        [surveyId]: {
          survey: res.survey,
          totalResponses: res.totalResponses || 0,
          byQuestion: res.byQuestion || {},
        },
      }));
    } catch {
      // ignore
    }
  };

  // Load questions for surveys
  const ensureQuestions = async (surveyId: string) => {
    if (questionsBySurveyId[surveyId]) return;
    try {
      const res = await api.request<{ ok: true; survey: BackendSurvey; questions: BackendSurveyQuestion[] }>(
        `/api/surveys/${surveyId}`,
        'GET'
      );
      setQuestionsBySurveyId((prev) => ({ ...prev, [surveyId]: res.questions || [] }));
    } catch {
      // ignore
    }
  };

  // When a survey is submitted or completed, automatically load its analytics
  useEffect(() => {
    for (const s of surveys) {
      const isCompleted = Boolean(submitted[s._id]) || !s.isActive;
      if (isCompleted && !analyticsData[s._id]) {
        void loadSurveyAnalytics(s._id);
        void ensureQuestions(s._id);
      }
    }
  }, [surveys, submitted]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (surveyId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const questions = questionsBySurveyId[surveyId] || [];
    if (questions.length === 0) return;

    const payloadAnswers = questions.map((q) => ({
      question: q._id,
      value: answers[q._id] || '',
    }));

    setError('');
    setSubmittingSurveyId(surveyId);
    try {
      await api.authedRequest(`/api/surveys/${surveyId}/responses`, 'POST', { answers: payloadAnswers });
      setSubmitted((prev) => ({ ...prev, [surveyId]: true }));
      setActiveSurveyId(null);
      setViewingAnalyticsId(surveyId);
      await loadSurveyAnalytics(surveyId);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit survey');
    } finally {
      setSubmittingSurveyId(null);
    }
  };

  const completedCount = useMemo(() => {
    return Object.values(submitted).filter(Boolean).length;
  }, [submitted]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>Surveys & Citizen Feedback</span>
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold uppercase tracking-wider">
              Governance
            </span>
          </h1>
          <p className="text-gray-500 mt-1">
            Voice your opinion on key regional initiatives. Total response statistics and analytical graphs are displayed immediately after survey completion.
          </p>
        </div>

        <button
          onClick={() => {
            void fetchSurveys();
            if (isAuthenticated) void fetchMyResponses();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <AIInsightBanner text="Structured surveys drive evidence-based policy formulation. Result charts and response summaries unlock right after you submit your feedback." />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        {[
          { label: 'Total Surveys', value: surveys.length, color: 'bg-blue-50 text-blue-600', icon: ClipboardList },
          { label: 'Active Surveys', value: surveys.filter((s) => s.isActive).length, color: 'bg-yellow-50 text-yellow-700', icon: Clock },
          { label: 'Completed by Me', value: completedCount, color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
          { label: 'Feedback Impact', value: 'High', color: 'bg-purple-50 text-purple-600', icon: TrendingUp },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center font-bold flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Surveys List */}
      <div className="space-y-6">
        {surveys.map((survey) => {
          const isSubmitted = Boolean(submitted[survey._id]);
          const isCompleted = isSubmitted || !survey.isActive;
          const questions = questionsBySurveyId[survey._id] || [];
          const isTaking = activeSurveyId === survey._id;
          const analytics = analyticsData[survey._id];
          const totalResponses = analytics?.totalResponses || 0;
          const isViewingAnalytics = viewingAnalyticsId === survey._id || (isCompleted && !isTaking);

          return (
            <div
              key={survey._id}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                isCompleted ? 'border-green-200 ring-1 ring-green-50' : 'border-gray-200'
              }`}
            >
              {/* Header stripe */}
              <div className={`h-2 ${isCompleted ? 'bg-gradient-to-r from-green-500 via-yellow-400 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`} />

              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            {isSubmitted ? 'Completed' : 'Closed Survey Results'}
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            Active Survey
                          </>
                        )}
                      </span>

                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : 'Live'}
                      </span>

                      {isCompleted && (
                        <span className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-xs font-bold text-yellow-900 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                          {totalResponses.toLocaleString()} Total Responses
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{survey.title}</h3>
                    <p className="text-sm text-gray-600">{survey.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          const next = isTaking ? null : survey._id;
                          setActiveSurveyId(next);
                          if (next) void ensureQuestions(next);
                        }}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
                          isTaking
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        }`}
                      >
                        {isTaking ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Close Form
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" /> Take Survey
                          </>
                        )}
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => {
                          setViewingAnalyticsId(viewingAnalyticsId === survey._id ? null : survey._id);
                          if (!analytics) void loadSurveyAnalytics(survey._id);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                        {viewingAnalyticsId === survey._id ? 'Hide Graphs' : 'View Analytics & Graphs'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ACTIVE SURVEY QUESTION FORM (BEFORE COMPLETION) */}
                {isTaking && !isCompleted && (
                  <div className="mt-6 pt-6 border-t border-gray-100 bg-gray-50/70 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                      Survey Questions ({questions.length})
                    </h4>

                    <div className="space-y-6">
                      {questions.map((q, qi) => (
                        <div key={q._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
                          <p className="text-sm font-bold text-gray-900 mb-3.5 flex items-start gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-black">
                              Q{qi + 1}
                            </span>
                            <span>{q.prompt}</span>
                          </p>

                          {q.type === 'mcq' && q.options && (
                            <div className="space-y-2.5">
                              {q.options.map((opt) => {
                                const isOptSelected = answers[q._id] === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleAnswer(q._id, opt)}
                                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                                      isOptSelected
                                        ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <span className="text-sm">{opt}</span>
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isOptSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                      }`}
                                    >
                                      {isOptSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'text' && (
                            <textarea
                              value={answers[q._id] || ''}
                              onChange={(e) => handleAnswer(q._id, e.target.value)}
                              placeholder="Write your detailed suggestions or feedback here..."
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Graphs, percentages, and response totals will display immediately after you submit.
                      </p>
                      <button
                        onClick={() => void handleSubmit(survey._id)}
                        disabled={submittingSurveyId === survey._id}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {submittingSurveyId === survey._id ? 'Submitting...' : 'Submit Survey & View Analytics'}
                      </button>
                    </div>
                  </div>
                )}

                {/* AFTER COMPLETION: Total Count, Question Breakdown & Recharts Graphs */}
                {isCompleted && viewingAnalyticsId === survey._id && (
                  <div className="mt-6 pt-6 border-t border-gray-100 bg-gray-50/60 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          Survey Results & Graphical Analytics
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Calculated from <strong className="text-gray-800">{totalResponses} total verified submissions</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Question Analytics Sections */}
                    <div className="space-y-6">
                      {questions.map((q, qi) => {
                        const qAnalytics = analytics?.byQuestion?.[q._id];
                        const chartType = chartTypes[q._id] || 'bar';

                        const graphData = (qAnalytics?.results || []).map((r, i) => ({
                          name: r.option,
                          shortName: r.option.length > 16 ? r.option.slice(0, 14) + '...' : r.option,
                          count: r.count,
                          percentage: r.percentage,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        }));

                        return (
                          <div key={q._id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <p className="text-sm font-bold text-gray-900">
                                <span className="text-blue-600 font-black mr-2">Q{qi + 1}.</span>
                                {q.prompt}
                              </p>

                              {q.type === 'mcq' && graphData.length > 0 && (
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setChartTypes((p) => ({ ...p, [q._id]: 'bar' }))}
                                    className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${
                                      chartType === 'bar' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600'
                                    }`}
                                    title="Bar View"
                                  >
                                    <BarChart3 className="w-3.5 h-3.5" /> Bar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setChartTypes((p) => ({ ...p, [q._id]: 'pie' }))}
                                    className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${
                                      chartType === 'pie' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600'
                                    }`}
                                    title="Pie View"
                                  >
                                    <PieIcon className="w-3.5 h-3.5" /> Pie
                                  </button>
                                </div>
                              )}
                            </div>

                            {q.type === 'mcq' ? (
                              <div className="grid lg:grid-cols-2 gap-6 items-center">
                                {/* Option percentage bars */}
                                <div className="space-y-3">
                                  {(qAnalytics?.results || []).map((res, ri) => {
                                    const barColor = CHART_COLORS[ri % CHART_COLORS.length];
                                    return (
                                      <div key={res.option} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                          <div className="flex items-center gap-2 truncate">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor }} />
                                            <span className="text-gray-800 truncate">{res.option}</span>
                                          </div>
                                          <div className="text-right flex-shrink-0 ml-2">
                                            <span className="text-blue-900 font-black">{res.percentage}%</span>
                                            <span className="text-gray-400 font-normal ml-1">({res.count})</span>
                                          </div>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                              width: `${Math.max(res.percentage, res.count > 0 ? 3 : 0)}%`,
                                              backgroundColor: barColor,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Recharts Visual Graph */}
                                {graphData.length > 0 && (
                                  <div className="h-52 w-full bg-gray-50/80 rounded-xl p-2 border border-gray-100">
                                    {chartType === 'bar' ? (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                          <XAxis
                                            dataKey="shortName"
                                            tick={{ fontSize: 10, fill: '#4b5563' }}
                                            interval={0}
                                            angle={-10}
                                            textAnchor="end"
                                          />
                                          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                                          <Tooltip
                                            formatter={(value: any, name: any, item: any) => [
                                              `${value} answers (${item?.payload?.percentage}%)`,
                                              item?.payload?.name,
                                            ]}
                                            contentStyle={{
                                              backgroundColor: '#1e293b',
                                              color: '#fff',
                                              borderRadius: '8px',
                                              fontSize: '11px',
                                              border: 'none',
                                            }}
                                          />
                                          <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                                            {graphData.map((entry, idx) => (
                                              <Cell key={`survey-cell-${idx}`} fill={entry.fill} />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    ) : (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={graphData}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={55}
                                            paddingAngle={3}
                                          >
                                            {graphData.map((entry, idx) => (
                                              <Cell key={`survey-pie-${idx}`} fill={entry.fill} />
                                            ))}
                                          </Pie>
                                          <Tooltip
                                            formatter={(value: any, name: any, item: any) => [
                                              `${value} answers (${item?.payload?.percentage}%)`,
                                              name,
                                            ]}
                                            contentStyle={{
                                              backgroundColor: '#1e293b',
                                              color: '#fff',
                                              borderRadius: '8px',
                                              fontSize: '11px',
                                              border: 'none',
                                            }}
                                          />
                                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Text question responses feedback view */
                              <div>
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Member Feedback Samples ({(qAnalytics?.samples || []).length} received)
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {(qAnalytics?.samples || []).map((sample, sIdx) => (
                                    <div key={sIdx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 italic">
                                      "{sample}"
                                    </div>
                                  ))}
                                  {(!qAnalytics?.samples || qAnalytics.samples.length === 0) && (
                                    <p className="text-xs text-gray-400">No written feedback responses submitted yet.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {surveys.length === 0 && !loading && (
          <div className="py-16 bg-white rounded-2xl border border-gray-100 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No active surveys available</h3>
            <p className="text-sm text-gray-500 mt-1">Check back later for new government and party questionnaires.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;
