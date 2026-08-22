import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import AIInsightBanner from './AIInsightBanner';
import {
  BarChart3, Clock, CheckCircle2, Users, PieChart as PieIcon,
  TrendingUp, ArrowRight, Award, ChevronDown, ChevronUp, Sparkles, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { api } from '@/lib/api';

type BackendPollOption = {
  _id: string;
  text: string;
};

type BackendPoll = {
  _id: string;
  question: string;
  options: BackendPollOption[];
  isActive: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

type PollResultData = {
  poll: BackendPoll;
  totalVotes: number;
  results: Array<{
    optionId: string;
    text: string;
    count: number;
    percentage: number;
  }>;
};

const CHART_COLORS = [
  '#2563eb', // Blue
  '#eab308', // Yellow
  '#16a34a', // Green
  '#dc2626', // Red
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#ec4899', // Pink
];

const PollsPage: React.FC = () => {
  const { isAuthenticated, setShowLoginModal } = useAppContext();
  const [polls, setPolls] = useState<BackendPoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votedPollIds, setVotedPollIds] = useState<Record<string, string>>({});
  const [pollResults, setPollResults] = useState<Record<string, PollResultData>>({});
  const [chartTypes, setChartTypes] = useState<Record<string, 'bar' | 'pie'>>({});
  const [expandedStats, setExpandedStats] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // Fetch all polls
  const fetchPolls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.request<{ ok: true; items: BackendPoll[] }>('/api/polls', 'GET');
      setPolls(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's previous votes if authenticated
  const fetchMyVotes = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.authedRequest<{ ok: true; votedMap: Record<string, string> }>('/api/polls/my-votes', 'GET');
      if (res.votedMap) {
        setVotedPollIds((prev) => ({ ...prev, ...res.votedMap }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchPolls();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchMyVotes();
    }
  }, [isAuthenticated]);

  // Load results for voted or closed polls
  const loadPollResults = async (pollId: string) => {
    try {
      const res = await api.request<{ ok: true; poll: BackendPoll; totalVotes: number; results: any[] }>(
        `/api/polls/${pollId}/results`,
        'GET'
      );
      setPollResults((prev) => ({
        ...prev,
        [pollId]: {
          poll: res.poll,
          totalVotes: res.totalVotes || 0,
          results: res.results || [],
        },
      }));
    } catch {
      // ignore
    }
  };

  // Whenever a poll is detected as voted or closed, fetch its live aggregated results
  useEffect(() => {
    for (const poll of polls) {
      const isVoted = Boolean(votedPollIds[poll._id]);
      const isClosed = !poll.isActive;
      if ((isVoted || isClosed) && !pollResults[poll._id]) {
        void loadPollResults(poll._id);
      }
    }
  }, [polls, votedPollIds]);

  const activePolls = useMemo(() => polls.filter((p) => p.isActive), [polls]);

  const handleVote = async (pollId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const optionId = selectedOptions[pollId];
    if (!optionId) return;
    if (votedPollIds[pollId]) return;

    setError('');
    setVotingId(pollId);
    try {
      await api.authedRequest(`/api/polls/${pollId}/vote`, 'POST', { optionId });
      setVotedPollIds((prev) => ({ ...prev, [pollId]: optionId }));
      await loadPollResults(pollId);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit vote');
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>Polls & Democratic Voting</span>
            <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold uppercase tracking-wider">
              Official
            </span>
          </h1>
          <p className="text-gray-500 mt-1">
            Cast your vote securely. Full vote counts, percentage breakdowns, and analytical graphs appear immediately upon voting.
          </p>
        </div>

        <button
          onClick={() => {
            void fetchPolls();
            if (isAuthenticated) void fetchMyVotes();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <AIInsightBanner text="Democratic voting empowers party members to directly guide initiatives. Vote statistics and graphs remain confidential until you participate to preserve unbiased civic engagement." />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        {[
          { label: 'Active Polls', value: activePolls.length, icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Polls', value: polls.length, icon: Users, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'My Voted Polls', value: Object.keys(votedPollIds).length, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Participation Status', value: Object.keys(votedPollIds).length ? 'Active Voter' : 'Ready', icon: Award, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0 font-bold`}>
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

      {/* Polls Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {polls.map((poll) => {
          const votedOptionId = votedPollIds[poll._id];
          const hasCompleted = Boolean(votedOptionId) || !poll.isActive;
          const resultData = pollResults[poll._id];
          const totalVotes = resultData?.totalVotes ?? 0;
          const isVotingThis = votingId === poll._id;
          const currentChartType = chartTypes[poll._id] || 'bar';

          // Format graph data
          const graphData = (resultData?.results || []).map((r, i) => ({
            name: r.text,
            shortName: r.text.length > 18 ? r.text.slice(0, 16) + '...' : r.text,
            votes: r.count,
            percentage: r.percentage,
            fill: CHART_COLORS[i % CHART_COLORS.length],
          }));

          return (
            <div
              key={poll._id}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md flex flex-col ${
                hasCompleted ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Poll Top Banner */}
              <div className={`h-2 ${hasCompleted ? 'bg-gradient-to-r from-blue-600 via-yellow-400 to-green-500' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />

              <div className="p-6 flex-1 flex flex-col">
                {/* Status Bar */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {hasCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        {votedOptionId ? 'Voted & Completed' : 'Closed Poll Results'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        Active Poll
                      </span>
                    )}

                    {poll.isActive && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : 'Live'}
                      </span>
                    )}
                  </div>

                  {hasCompleted && (
                    <div className="px-3 py-1 bg-yellow-50 border border-yellow-200/80 rounded-lg text-xs font-bold text-yellow-900 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                      <span>{totalVotes.toLocaleString()} Total Votes</span>
                    </div>
                  )}
                </div>

                {/* Question */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 leading-snug">
                  {poll.question}
                </h3>

                {/* BEFORE COMPLETION: Interactive Radio Option Choices Only */}
                {!hasCompleted ? (
                  <div className="space-y-3 flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">Select an option to cast your vote:</p>
                    {poll.options.map((opt) => {
                      const isSelected = selectedOptions[poll._id] === opt._id;
                      return (
                        <button
                          key={opt._id}
                          type="button"
                          onClick={() => setSelectedOptions((p) => ({ ...p, [poll._id]: opt._id }))}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                            {opt.text}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}

                    <div className="pt-4 mt-auto">
                      <button
                        onClick={() => void handleVote(poll._id)}
                        disabled={!selectedOptions[poll._id] || isVotingThis || !poll.isActive}
                        className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVotingThis ? (
                          <>Recording Vote...</>
                        ) : (
                          <>
                            Submit Vote & View Results <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-gray-400 text-center mt-2">
                        Counts and graph results will unlock immediately after submission.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* AFTER COMPLETION: Total Count, Option Breakdown & Interactive Graphs */
                  <div className="space-y-5 flex-1 flex flex-col">
                    {/* Option Percentages & Counts */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <span>Poll Options</span>
                        <span>Votes & Share</span>
                      </div>

                      {(resultData?.results || poll.options.map(o => ({ optionId: o._id, text: o.text, count: 0, percentage: 0 }))).map((r, i) => {
                        const isMyChoice = votedOptionId === r.optionId;
                        const barColor = CHART_COLORS[i % CHART_COLORS.length];
                        return (
                          <div
                            key={r.optionId}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isMyChoice ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100 bg-gray-50/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
                                <span className={`text-sm truncate ${isMyChoice ? 'font-black text-blue-950' : 'font-semibold text-gray-800'}`}>
                                  {r.text}
                                </span>
                                {isMyChoice && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white flex-shrink-0">
                                    Your Vote
                                  </span>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-sm font-black text-gray-900">{r.percentage}%</span>
                                <span className="text-xs text-gray-500 ml-1.5">({r.count} {r.count === 1 ? 'vote' : 'votes'})</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${Math.max(r.percentage, r.count > 0 ? 3 : 0)}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Graphical Chart Visualization Section */}
                    {graphData.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              Visual Graph Breakdown
                            </span>
                          </div>

                          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setChartTypes((p) => ({ ...p, [poll._id]: 'bar' }))}
                              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                                currentChartType === 'bar' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600 hover:text-gray-900'
                              }`}
                              title="Bar Chart View"
                            >
                              <BarChart3 className="w-3.5 h-3.5" /> Bar
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartTypes((p) => ({ ...p, [poll._id]: 'pie' }))}
                              className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                                currentChartType === 'pie' ? 'bg-white shadow-xs text-blue-700' : 'text-gray-600 hover:text-gray-900'
                              }`}
                              title="Pie Chart View"
                            >
                              <PieIcon className="w-3.5 h-3.5" /> Pie
                            </button>
                          </div>
                        </div>

                        {/* Chart Render */}
                        <div className="h-56 w-full bg-gray-50/70 rounded-xl p-2 border border-gray-100">
                          {currentChartType === 'bar' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <XAxis
                                  dataKey="shortName"
                                  tick={{ fontSize: 11, fill: '#4b5563' }}
                                  interval={0}
                                  angle={-15}
                                  textAnchor="end"
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                                <Tooltip
                                  formatter={(value: any, name: any, item: any) => [
                                    `${value} votes (${item?.payload?.percentage}%)`,
                                    item?.payload?.name,
                                  ]}
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    border: 'none',
                                  }}
                                />
                                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                                  {graphData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={graphData}
                                  dataKey="votes"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={35}
                                  outerRadius={65}
                                  paddingAngle={3}
                                >
                                  {graphData.map((entry, index) => (
                                    <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: any, name: any, item: any) => [
                                    `${value} votes (${item?.payload?.percentage}%)`,
                                    name,
                                  ]}
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    border: 'none',
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {polls.length === 0 && !loading && (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No active polls found</h3>
            <p className="text-sm text-gray-500 mt-1">Check back soon for new democratic polls and voting sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsPage;
