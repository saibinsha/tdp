import React, { useMemo, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import AIInsightBanner from './AIInsightBanner';
import {
  Users, FileText, BarChart3, Briefcase, MessageCircle, Shield, Bell,
  TrendingUp, TrendingDown, Eye, EyeOff, Trash2, Ban, CheckCircle, XCircle,
  Search, Filter, Download, RefreshCw, AlertTriangle, Activity, Mail, Globe, Phone, Video,
  MapPin, Image, Upload, Plus, Link, Key, Lock, Check, Sparkles, Loader2, X,
  Award, Newspaper, ExternalLink, Edit
} from 'lucide-react';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';

const AdminDashboard: React.FC = () => {
  const { currentPage, setCurrentPage, setDmTargetUserId, isAuthenticated } = useAppContext();
  const [activeTab, setActiveTab] = useState(currentPage === 'admin-dashboard' ? 'users' : currentPage.replace('admin-', ''));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [blogs, setBlogs] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [blogComments, setBlogComments] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);

  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [communityMessages, setCommunityMessages] = useState<any[]>([]);
  const [callRecords, setCallRecords] = useState<any[]>([]);

  // Leadership & News Members management states
  const [leadershipCategoryFilter, setLeadershipCategoryFilter] = useState<string>('all');
  const [leadersSearchQuery, setLeadersSearchQuery] = useState<string>('');
  const [leaderViewMode, setLeaderViewMode] = useState<'all' | 'news_tracker'>('all');

  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState('');
  const [leaderRole, setLeaderRole] = useState('');
  const [leaderCategory, setLeaderCategory] = useState('state_leadership');
  const [leaderPhotoUrl, setLeaderPhotoUrl] = useState('');
  const [leaderBio, setLeaderBio] = useState('');
  const [leaderConstituency, setLeaderConstituency] = useState('');
  const [leaderDistrict, setLeaderDistrict] = useState('');
  const [leaderTrackInNews, setLeaderTrackInNews] = useState(true);
  const [leaderSearchKeywords, setLeaderSearchKeywords] = useState('');
  const [leaderOrder, setLeaderOrder] = useState<number>(0);
  const [leaderPhotoUploading, setLeaderPhotoUploading] = useState(false);
  const [leaderSuccessMsg, setLeaderSuccessMsg] = useState('');
  const [testingLeaderNewsId, setTestingLeaderNewsId] = useState<string | null>(null);
  const [testNewsArticles, setTestNewsArticles] = useState<any[] | null>(null);
  const [testNewsLeaderName, setTestNewsLeaderName] = useState('');
  const leaderFileInputRef = useRef<HTMLInputElement>(null);

  const [adminChatUserQuery, setAdminChatUserQuery] = useState('');
  const [adminChatUsers, setAdminChatUsers] = useState<any[]>([]);
  const [adminChatTargetUserId, setAdminChatTargetUserId] = useState<string | null>(null);
  const [adminChatConversations, setAdminChatConversations] = useState<any[]>([]);
  const [adminChatActiveOtherUserId, setAdminChatActiveOtherUserId] = useState<string | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [loadingAdminChat, setLoadingAdminChat] = useState(false);

  const [presenceOnline, setPresenceOnline] = React.useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('tdp_presence_online');
      return raw ? (JSON.parse(raw) as any) : {};
    } catch {
      return {};
    }
  });

  const [autoAnswerQuery, setAutoAnswerQuery] = useState('');
  const [autoAnswerUsers, setAutoAnswerUsers] = useState<any[]>([]);
  const [loadingAutoAnswer, setLoadingAutoAnswer] = useState(false);

  const [viewingGroup, setViewingGroup] = useState<any | null>(null);
  const [groupPreviewMessages, setGroupPreviewMessages] = useState<any[]>([]);
  const [loadingGroupPreview, setLoadingGroupPreview] = useState(false);

  // Blog creation states (with full media support)
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogMediaLink, setBlogMediaLink] = useState('');
  const [blogDraftMedia, setBlogDraftMedia] = useState<Array<{ url: string; publicId?: string; resourceType?: 'image' | 'video' | 'raw' }>>([]);
  const [blogUploading, setBlogUploading] = useState(false);
  const blogFileInputRef = useRef<HTMLInputElement>(null);

  const [pollDrafts, setPollDrafts] = useState<Array<{ question: string; options: string[] }>>([
    { question: '', options: ['', ''] },
  ]);

  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDraftQuestions, setSurveyDraftQuestions] = useState<Array<{ type: 'text' | 'mcq'; prompt: string; options: string[] }>>([
    { type: 'text', prompt: '', options: [] },
  ]);

  // Works creation states (with location & required fields)
  const [workTitle, setWorkTitle] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workCategory, setWorkCategory] = useState('Infrastructure');
  const [workPriority, setWorkPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [workDescription, setWorkDescription] = useState('');

  // User creation states (with name, email, password, phone, role, district)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserDistrict, setNewUserDistrict] = useState('');
  const [newUserConstituency, setNewUserConstituency] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [allowUserRegistration, setAllowUserRegistration] = useState(true);
  const [updatingRegistrationSetting, setUpdatingRegistrationSetting] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupPublic, setGroupPublic] = useState(true);

  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'leaders', label: 'Leadership & News', icon: Award },
    { id: 'blogs', label: 'Blogs', icon: FileText },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'surveys', label: 'Surveys', icon: BarChart3 },
    { id: 'works', label: 'Works', icon: Briefcase },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'group-requests', label: 'Group Requests', icon: Shield },
    { id: 'community', label: 'Community', icon: Globe },
    { id: 'call-records', label: 'Call Records', icon: Activity },
    { id: 'auto-answer', label: 'Auto Answer', icon: Phone },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'reports', label: 'Reports', icon: Shield },
    { id: 'contacts', label: 'Contacts', icon: Bell },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
  ];

  React.useEffect(() => {
    if (currentPage.startsWith('admin-')) {
      const tab = currentPage.replace('admin-', '');
      setActiveTab(tab === 'dashboard' ? 'users' : tab);
    }
  }, [currentPage]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    let s: any;
    try {
      s = connectSocket();
    } catch {
      return;
    }

    const onPresenceState = (payload: any) => {
      const ids: string[] = Array.isArray(payload?.onlineUserIds) ? payload.onlineUserIds.map((x: any) => String(x)) : [];
      setPresenceOnline(() => {
        const next: Record<string, boolean> = {};
        for (const id of ids) next[String(id)] = true;
        return next;
      });
    };

    const onPresenceUpdate = (payload: any) => {
      const uid = String(payload?.userId || '').trim();
      if (!uid) return;
      const online = Boolean(payload?.online);
      setPresenceOnline((prev) => ({ ...prev, [uid]: online }));
    };

    s.on('presence:state', onPresenceState);
    s.on('presence:update', onPresenceUpdate);
    return () => {
      s.off('presence:state', onPresenceState);
      s.off('presence:update', onPresenceUpdate);
    };
  }, [isAuthenticated]);

  const runAutoAnswerSearch = async () => {
    const q = autoAnswerQuery.trim();
    if (!q) {
      setAutoAnswerUsers([]);
      return;
    }
    setError('');
    setLoadingAutoAnswer(true);
    try {
      const res = await api.authedRequest<{ ok: true; items: any[] }>(`/api/users/directory?q=${encodeURIComponent(q)}&limit=20`, 'GET');
      setAutoAnswerUsers(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to search users');
    } finally {
      setLoadingAutoAnswer(false);
    }
  };

  const startAdminAutoAnswerCall = (toUserId: string, kind: 'audio' | 'video') => {
    try {
      localStorage.setItem(
        'tdp_admin_auto_call',
        JSON.stringify({
          toUserId: String(toUserId),
          kind,
          autoAnswer: true,
        })
      );
    } catch {
      // ignore
    }

    setDmTargetUserId(String(toUserId));
    setCurrentPage('messages');
  };

  const renderAutoAnswer = () => (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Auto Answer Calls</h3>
          <p className="text-sm text-gray-500">Search a member and place a call that auto-answers on their side (admin-only).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={autoAnswerQuery}
              onChange={(e) => setAutoAnswerQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void runAutoAnswerSearch()}
              placeholder="Search by name / membership id"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <button
            disabled={loadingAutoAnswer}
            onClick={() => void runAutoAnswerSearch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {loadingAutoAnswer && <p className="mt-3 text-sm text-gray-500">Searching...</p>}

        <div className="mt-4 space-y-2">
          {(autoAnswerUsers || []).map((u) => {
            const uid = String(u?._id || '');
            const name = String(u?.name || 'Member');
            const mid = String(u?.membershipId || '');
            const online = Boolean(presenceOnline[uid]);
            return (
              <div key={uid} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {mid ? `ID: ${mid} • ` : ''}
                    {online ? 'online' : 'offline'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startAdminAutoAnswerCall(uid, 'audio')}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-black hover:bg-green-700"
                    title="Auto-answer voice call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startAdminAutoAnswerCall(uid, 'video')}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-black hover:bg-purple-700"
                    title="Auto-answer video call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {!loadingAutoAnswer && autoAnswerQuery.trim() && (autoAnswerUsers || []).length === 0 && (
            <p className="text-sm text-gray-500">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );

  const loadTabData = React.useCallback(async (tabId: string) => {
    setError('');
    setLoading(true);
    try {
      if (tabId === 'blogs') {
        const res = await api.request<{ ok: true; items: any[] }>('/api/blogs', 'GET');
        setBlogs(res.items || []);
      }

      if (tabId === 'comments') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/admin/blog-comments?limit=200', 'GET');
        setBlogComments(res.items || []);
      }

      if (tabId === 'polls') {
        const res = await api.request<{ ok: true; items: any[] }>('/api/polls', 'GET');
        setPolls(res.items || []);
      }

      if (tabId === 'surveys') {
        const res = await api.request<{ ok: true; items: any[] }>('/api/surveys', 'GET');
        setSurveys(res.items || []);
      }

      if (tabId === 'works') {
        const res = await api.request<{ ok: true; items: any[] }>('/api/works', 'GET');
        setWorks(res.items || []);
      }

      if (tabId === 'users') {
        const [usersRes, settingsRes] = await Promise.all([
          api.authedRequest<{ ok: true; items: any[] }>('/api/users?limit=50', 'GET'),
          api.authedRequest<{ ok: true; settings?: { allowUserRegistration?: boolean } }>(
            '/api/users/settings/registration',
            'GET'
          ),
        ]);
        setUsers(usersRes.items || []);
        setAllowUserRegistration(settingsRes?.settings?.allowUserRegistration !== false);
      }

      if (tabId === 'leaders') {
        const res = await api.request<{ ok: true; items: any[] }>('/api/leaders?activeOnly=false', 'GET');
        setLeaders(res.items || []);
      }

      if (tabId === 'groups') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/groups?limit=200', 'GET');
        setGroups(res.items || []);
      }

      if (tabId === 'group-requests') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/groups/requests', 'GET');
        setGroupRequests(res.items || []);
      }

      if (tabId === 'community') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/messages/community?limit=200', 'GET');
        setCommunityMessages(res.items || []);
      }

      if (tabId === 'call-records') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/call-records?limit=200', 'GET');
        setCallRecords(res.items || []);
      }

      if (tabId === 'alerts') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/alerts', 'GET');
        setAlerts(res.items || []);
      }

      if (tabId === 'reports') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/reports?limit=50', 'GET');
        setReports(res.items || []);
      }

      if (tabId === 'contacts') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/contact?limit=100', 'GET');
        setContacts(res.items || []);
      }

      if (tabId === 'newsletter') {
        const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/newsletter?limit=200', 'GET');
        setSubscribers(res.items || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApproveGroupRequest = async (groupId: string, userId: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/groups/${groupId}/requests/${userId}/approve`, 'POST', {});
      const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/groups/requests', 'GET');
      setGroupRequests(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Approve failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectGroupRequest = async (groupId: string, userId: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/groups/${groupId}/requests/${userId}`, 'DELETE');
      const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/groups/requests', 'GET');
      setGroupRequests(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Reject failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockGroupRequest = async (groupId: string, userId: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/groups/${groupId}/requests/${userId}/block`, 'POST', {});
      const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/groups/requests', 'GET');
      setGroupRequests(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Block failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunityMessageAdmin = async (messageId: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/messages/community/${messageId}`, 'DELETE');
      const res = await api.authedRequest<{ ok: true; items: any[] }>('/api/messages/community?limit=200', 'GET');
      setCommunityMessages(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContactStatus = async (id: string, status: 'new' | 'in_progress' | 'closed') => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/contact/${id}/status`, 'PATCH', { status });
      await loadTabData('contacts');
    } catch (e: any) {
      setError(e?.message || 'Failed to update contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlogComment = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/admin/blog-comments/${id}`, 'DELETE');
      await loadTabData('comments');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/contact/${id}`, 'DELETE');
      await loadTabData('contacts');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!activeTab) return;
    if (activeTab === 'dashboard' || activeTab === 'chats') return;
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  const runAdminChatUserSearch = async () => {
    const q = adminChatUserQuery.trim();
    if (!q) {
      setAdminChatUsers([]);
      return;
    }
    setError('');
    setLoadingAdminChat(true);
    try {
      const res = await api.authedRequest<{ ok: true; items: any[] }>(`/api/users/directory?q=${encodeURIComponent(q)}&limit=20`, 'GET');
      setAdminChatUsers(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to search users');
    } finally {
      setLoadingAdminChat(false);
    }
  };

  const openAdminChatUser = async (uid: string) => {
    setAdminChatTargetUserId(uid);
    setAdminChatActiveOtherUserId(null);
    setAdminChatMessages([]);
    setError('');
    setLoadingAdminChat(true);
    try {
      const res = await api.authedRequest<{ ok: true; items: any[] }>(
        `/api/admin/chats/private/conversations?userId=${encodeURIComponent(uid)}&limit=50`,
        'GET'
      );
      setAdminChatConversations(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load conversations');
    } finally {
      setLoadingAdminChat(false);
    }
  };

  const renderCallRecords = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Call Records</h3>
        <button
          onClick={() => loadTabData('call-records')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {callRecords.map((r) => {
          const created = r?.createdAt ? new Date(r.createdAt) : null;
          const uploaderName = r?.uploader?.name || 'Member';
          const scope = r?.scope || 'private';
          const kind = r?.kind || 'audio';
          const url = r?.file?.url || '';
          const duration = r?.durationSec ? `${r.durationSec}s` : '—';

          return (
            <div key={r._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {scope.toUpperCase()} • {kind.toUpperCase()} • {duration}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Uploaded by: {uploaderName}
                    {created ? ` • ${created.toLocaleString()}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 break-all">CallId: {String(r.callId || '')}</p>
                </div>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"
                    title="Download"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                )}
              </div>

              {url && (
                <div className="mt-3">
                  <audio controls preload="none" className="w-full">
                    <source src={url} />
                  </audio>
                </div>
              )}
            </div>
          );
        })}

        {callRecords.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-500">No recordings found.</div>
        )}
      </div>
    </div>
  );

  const openAdminChatThread = async (otherUserId: string) => {
    if (!adminChatTargetUserId) return;
    setAdminChatActiveOtherUserId(otherUserId);
    setError('');
    setLoadingAdminChat(true);
    try {
      const res = await api.authedRequest<{ ok: true; items: any[] }>(
        `/api/admin/chats/private/${adminChatTargetUserId}/${otherUserId}?limit=200`,
        'GET'
      );
      setAdminChatMessages(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load messages');
    } finally {
      setLoadingAdminChat(false);
    }
  };

  const openGroupPreview = async (g: any) => {
    setViewingGroup(g);
    setGroupPreviewMessages([]);
    setError('');
    setLoadingGroupPreview(true);
    try {
      const res = await api.authedRequest<{ ok: true; items: any[] }>(`/api/messages/groups/${g._id}?limit=200`, 'GET');
      setGroupPreviewMessages(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load group messages');
    } finally {
      setLoadingGroupPreview(false);
    }
  };

  const stats = useMemo(() => {
    const pollResponses = 0;
    return [
      { label: 'Total Users', value: users.length ? users.length.toString() : '—', change: '+12.5%', up: true, icon: Users, color: 'from-blue-500 to-blue-600' },
      { label: 'Active Blogs', value: blogs.length.toString(), change: '+8.2%', up: true, icon: FileText, color: 'from-green-500 to-green-600' },
      { label: 'Poll Responses', value: pollResponses.toLocaleString(), change: '+23.1%', up: true, icon: BarChart3, color: 'from-purple-500 to-purple-600' },
      { label: 'Open Works', value: works.filter(w => w.status === 'Open').length.toString(), change: '-5.3%', up: false, icon: Briefcase, color: 'from-orange-500 to-orange-600' },
      { label: 'Pending Reports', value: reports.filter((r) => r.status === 'open').length.toString(), change: '+2', up: true, icon: Shield, color: 'from-red-500 to-red-600' },
      { label: 'Active Chats', value: '—', change: '+15.7%', up: true, icon: MessageCircle, color: 'from-teal-500 to-teal-600' },
    ];
  }, [blogs.length, reports, users.length, works]);

  const normalizeMediaUrl = (input: string): string => {
    let url = String(input || '').trim();
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/uploads/') && !url.startsWith('data:')) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('google.') && parsed.searchParams.get('imgurl')) {
        return decodeURIComponent(parsed.searchParams.get('imgurl') || url);
      }
      if (parsed.hostname.includes('drive.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
      }
      if (parsed.hostname.includes('dropbox.com')) {
        url = url.replace('?dl=0', '?raw=1');
        if (!url.includes('raw=1')) {
          url += (url.includes('?') ? '&' : '?') + 'raw=1';
        }
        return url;
      }
      if (parsed.hostname === 'imgur.com' && !url.includes('/a/') && !url.includes('/gallery/')) {
        const imgId = parsed.pathname.replace(/^\//, '');
        if (imgId && !imgId.includes('.')) {
          return `https://i.imgur.com/${imgId}.jpg`;
        }
      }
    } catch {
      // fallback
    }
    return url;
  };

  const inferBlogResourceType = (url: string): 'image' | 'video' | 'raw' => {
    const u = String(url || '').toLowerCase();
    if (u.match(/\.(mp4|webm|mov|m4v|avi)(\?|#|$)/)) return 'video';
    if (u.includes('youtube.com/watch') || u.includes('youtu.be/')) return 'video';
    return 'image';
  };

  const handlePickBlogFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBlogUploading(true);
    setError('');
    try {
      const next: Array<{ url: string; publicId?: string; resourceType?: 'image' | 'video' | 'raw' }> = [];
      for (const f of Array.from(files)) {
        const uploaded = await api.uploadSingle(f);
        next.push({
          url: uploaded.file.url,
          publicId: uploaded.file.publicId,
          resourceType: (uploaded.file.resourceType as any) || inferBlogResourceType(uploaded.file.url),
        });
      }
      setBlogDraftMedia((prev) => [...prev, ...next]);
    } catch (e: any) {
      setError(e?.message || 'Failed to upload media file');
    } finally {
      setBlogUploading(false);
      if (blogFileInputRef.current) blogFileInputRef.current.value = '';
    }
  };

  const handleAddBlogMediaLink = () => {
    const raw = blogMediaLink.trim();
    if (!raw) return;
    const items = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const added: Array<{ url: string; resourceType?: 'image' | 'video' | 'raw' }> = [];
    for (const item of items) {
      const normalized = normalizeMediaUrl(item);
      if (normalized) {
        const resourceType = inferBlogResourceType(normalized);
        added.push({ url: normalized, resourceType });
      }
    }
    if (added.length > 0) {
      setBlogDraftMedia((prev) => [...prev, ...added]);
      setBlogMediaLink('');
    }
  };

  const handleRemoveBlogMedia = (idx: number) => {
    setBlogDraftMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateBlog = async () => {
    setError('');
    if (!blogTitle.trim()) {
      setError('Blog title is required');
      return;
    }
    if (!blogContent.trim()) {
      setError('Blog content is required');
      return;
    }
    setLoading(true);
    try {
      const tags = blogTags
        ? blogTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await api.authedRequest('/api/blogs', 'POST', {
        title: blogTitle.trim(),
        content: blogContent.trim(),
        tags,
        media: blogDraftMedia,
      });
      setBlogTitle('');
      setBlogContent('');
      setBlogTags('');
      setBlogDraftMedia([]);
      setBlogMediaLink('');
      await loadTabData('blogs');
    } catch (e: any) {
      setError(e?.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/blogs/${id}`, 'DELETE');
      await loadTabData('blogs');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    // legacy handler no longer used
  };

  const handleCreatePollAt = async (idx: number) => {
    const draft = pollDrafts[idx];
    setError('');
    if (!draft?.question?.trim()) {
      setError('Question required');
      return;
    }
    const options = (draft.options || []).map((s) => String(s || '').trim()).filter(Boolean);
    if (options.length < 2) {
      setError('Add at least 2 options');
      return;
    }

    setLoading(true);
    try {
      await api.authedRequest('/api/polls', 'POST', { question: draft.question.trim(), options: options.map((text) => ({ text })) });
      setPollDrafts((prev) => prev.map((p, i) => (i === idx ? { question: '', options: ['', ''] } : p)));
      await loadTabData('polls');
    } catch (e: any) {
      setError(e?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllPolls = async () => {
    setError('');
    const ready = pollDrafts
      .map((d, idx) => ({
        idx,
        question: String(d.question || '').trim(),
        options: (d.options || []).map((s) => String(s || '').trim()).filter(Boolean),
      }))
      .filter((x) => x.question && x.options.length >= 2);

    if (ready.length === 0) {
      setError('Add at least one valid poll (question + 2 options)');
      return;
    }

    setLoading(true);
    try {
      for (const p of ready) {
        await api.authedRequest('/api/polls', 'POST', { question: p.question, options: p.options.map((text) => ({ text })) });
      }
      setPollDrafts([{ question: '', options: ['', ''] }]);
      await loadTabData('polls');
    } catch (e: any) {
      setError(e?.message || 'Failed to create polls');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/polls/${id}`, 'DELETE');
      await loadTabData('polls');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete poll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    setError('');
    if (!surveyTitle) {
      setError('Survey title required');
      return;
    }

    const normalized = (surveyDraftQuestions || [])
      .map((q, idx) => {
        const prompt = String(q.prompt || '').trim();
        const type = q.type === 'mcq' ? 'mcq' : 'text';
        const options = type === 'mcq'
          ? (q.options || []).map((s) => String(s || '').trim()).filter(Boolean)
          : [];
        return { order: idx, type, prompt, options };
      })
      .filter((q) => q.prompt);

    if (normalized.length === 0) {
      setError('Add at least one question');
      return;
    }
    for (const q of normalized) {
      if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
        setError('Each options question needs at least 2 options');
        return;
      }
    }

    setLoading(true);
    try {
      await api.authedRequest('/api/surveys', 'POST', { title: surveyTitle, questions: normalized });
      setSurveyTitle('');
      setSurveyDraftQuestions([{ type: 'text', prompt: '', options: [] }]);
      await loadTabData('surveys');
    } catch (e: any) {
      setError(e?.message || 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/surveys/${id}`, 'DELETE');
      await loadTabData('surveys');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete survey');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWork = async () => {
    setError('');
    if (!workTitle.trim()) {
      setError('Work title is required');
      return;
    }
    if (!workLocation.trim()) {
      setError('Location is required');
      return;
    }
    if (!workDescription.trim()) {
      setError('Work description is required');
      return;
    }
    setLoading(true);
    try {
      await api.authedRequest('/api/works', 'POST', {
        title: workTitle.trim(),
        description: workDescription.trim(),
        location: workLocation.trim(),
        category: workCategory || 'Infrastructure',
        priority: workPriority || 'Medium',
      });
      setWorkTitle('');
      setWorkDescription('');
      setWorkLocation('');
      setWorkCategory('Infrastructure');
      setWorkPriority('Medium');
      await loadTabData('works');
    } catch (e: any) {
      setError(e?.message || 'Failed to create work');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWork = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/works/${id}`, 'DELETE');
      await loadTabData('works');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete work');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkStatus = async (id: string, status: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/works/${id}`, 'PATCH', { status });
      await loadTabData('works');
    } catch (e: any) {
      setError(e?.message || 'Failed to update work');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setUserSuccessMsg('');
    if (!newUserName.trim()) {
      setError('Name is required');
      return;
    }
    if (!newUserEmail.trim()) {
      setError('Email is required');
      return;
    }
    if (!newUserPassword.trim()) {
      setError('Password is required');
      return;
    }
    if (newUserPassword.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.authedRequest<{ ok: true; user: any }>('/api/users', 'POST', {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        phone: newUserPhone.trim(),
        role: newUserRole,
        district: newUserDistrict.trim(),
        constituency: newUserConstituency.trim(),
      });
      setUserSuccessMsg(`User ${res.user?.name || newUserName} created successfully with password!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserRole('user');
      setNewUserDistrict('');
      setNewUserConstituency('');
      await loadTabData('users');
    } catch (e: any) {
      setError(e?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (id: string, status: 'active' | 'blocked') => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/users/${id}/status`, 'PATCH', { status });
      await loadTabData('users');
    } catch (e: any) {
      setError(e?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/users/${id}`, 'DELETE');
      await loadTabData('users');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserRegistration = async () => {
    setError('');
    setUpdatingRegistrationSetting(true);
    try {
      const res = await api.authedRequest<{ ok: true; settings?: { allowUserRegistration?: boolean } }>(
        '/api/users/settings/registration',
        'PATCH',
        { allowUserRegistration: !allowUserRegistration }
      );
      const next = res?.settings?.allowUserRegistration !== false;
      setAllowUserRegistration(next);
      setUserSuccessMsg(next ? 'User registration is now ON.' : 'User registration is now OFF.');
    } catch (e: any) {
      setError(e?.message || 'Failed to update registration setting');
    } finally {
      setUpdatingRegistrationSetting(false);
    }
  };

  const handleCreateGroup = async () => {
    setError('');
    if (!groupName) {
      setError('Group name required');
      return;
    }
    setLoading(true);
    try {
      await api.authedRequest('/api/groups', 'POST', { name: groupName, isPublic: groupPublic });
      setGroupName('');
      setGroupPublic(true);
      await loadTabData('groups');
    } catch (e: any) {
      setError(e?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/groups/${id}`, 'DELETE');
      await loadTabData('groups');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    setError('');
    if (!alertTitle || !alertMessage) {
      setError('Title and message required');
      return;
    }
    setLoading(true);
    try {
      await api.authedRequest('/api/alerts', 'POST', { title: alertTitle, message: alertMessage });
      setAlertTitle('');
      setAlertMessage('');
      await loadTabData('alerts');
    } catch (e: any) {
      setError(e?.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/alerts/${id}`, 'DELETE');
      await loadTabData('alerts');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete alert');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (id: string, action: 'resolve' | 'ignore') => {
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/reports/${id}/handle`, 'PATCH', { action });
      await loadTabData('reports');
    } catch (e: any) {
      setError(e?.message || 'Failed to update report');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Export Users', icon: Download, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { label: 'Send Alert', icon: Bell, color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' },
            { label: 'Review Reports', icon: Shield, color: 'bg-red-50 text-red-600 hover:bg-red-100' },
            { label: 'Refresh Data', icon: RefreshCw, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <button key={i} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}>
                <Icon className="w-4 h-4" /> {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Chart Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const width = [65, 72, 58, 80, 90, 95, 85][i];
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-8">{day}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-8">{Math.round(width * 3.5)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Content Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Blog Posts', count: blogs.length, total: 50, color: 'bg-blue-500' },
              { label: 'Active Polls', count: polls.length, total: 20, color: 'bg-green-500' },
              { label: 'Work Requests', count: works.length, total: 30, color: 'bg-orange-500' },
              { label: 'Groups', count: 8, total: 15, color: 'bg-purple-500' },
              { label: 'Reports', count: 4, total: 10, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{item.label}</span>
                  <span className="text-gray-400">{item.count}/{item.total}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.count / item.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGroupRequests = () => (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Group Access Requests</h3>
        <button
          disabled={loading}
          onClick={() => void loadTabData('group-requests')}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Group', 'Requester', 'Requested At', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(groupRequests || []).map((it) => {
              const groupId = String(it?.group?._id || '');
              const groupName = String(it?.group?.name || '—');
              const rUser = it?.request?.user;
              const userId = String(rUser?._id || it?.request?.user || '');
              const userName = String(rUser?.name || '—');
              const requestedAt = String(it?.request?.requestedAt || '').slice(0, 19).replace('T', ' ');
              return (
                <tr key={`${groupId}:${userId}`} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{groupName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{userName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{requestedAt || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        disabled={loading}
                        onClick={() => void handleApproveGroupRequest(groupId, userId)}
                        className="px-3 py-1.5 text-xs font-black bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => void handleRejectGroupRequest(groupId, userId)}
                        className="px-3 py-1.5 text-xs font-black bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => void handleBlockGroupRequest(groupId, userId)}
                        className="px-3 py-1.5 text-xs font-black bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
                      >
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {(groupRequests || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">No pending requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCommunityModeration = () => (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Community Moderation</h3>
        <button
          disabled={loading}
          onClick={() => void loadTabData('community')}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['From', 'Message', 'Created', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(communityMessages || []).map((m) => {
              const fromName = String(m?.from?.name || 'Member');
              const created = String(m?.createdAt || '').slice(0, 19).replace('T', ' ');
              const isDeleted = Boolean(m?.deletedAt);
              return (
                <tr key={m._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{fromName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[520px] truncate">{String(m?.text || '')}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{created || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isDeleted ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                    }`}>{isDeleted ? 'deleted' : 'active'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={loading}
                      onClick={() => void handleDeleteCommunityMessageAdmin(m._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {(communityMessages || []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">No messages found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderComments = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Blog Comments</h3>
        <button onClick={() => loadTabData('comments')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Blog', 'User', 'Comment', 'Date', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blogComments.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.blog?.title || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.user?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.text}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(c.createdAt || '').slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={loading}
                    onClick={() => void handleDeleteBlogComment(c._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {blogComments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">No comments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Contact Submissions</h3>
          <p className="text-sm text-gray-500">Messages submitted from the Contact page</p>
        </div>
        <button
          disabled={loading}
          onClick={() => loadTabData('contacts')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Category', 'Subject', 'Status', 'Date', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.category || 'General'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.subject || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.status}
                    disabled={loading}
                    onChange={(e) => handleUpdateContactStatus(c._id, e.target.value as any)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white disabled:opacity-50"
                  >
                    <option value="new">new</option>
                    <option value="in_progress">in_progress</option>
                    <option value="closed">closed</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(c.createdAt || '').slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      onClick={() => handleDeleteContact(c._id)}
                      className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contacts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">No contact submissions yet.</p>
          </div>
        )}
      </div>

      {contacts.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Latest Message</p>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {String(contacts[0]?.message || '')}
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">User & Member Management</h3>
          <p className="text-xs text-gray-500">Manage registered citizens, party workers, and administrators</p>
        </div>
        <button
          disabled={loading}
          onClick={() => loadTabData('users')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {userSuccessMsg && (
        <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{userSuccessMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Manual Registration</h4>
            <p className="text-xs text-gray-500">
              Turn OFF to hide signup/register for normal users and allow only login/Google sign-in.
            </p>
          </div>
          <button
            type="button"
            disabled={updatingRegistrationSetting}
            onClick={handleToggleUserRegistration}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
              allowUserRegistration
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                allowUserRegistration ? 'bg-green-600' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allowUserRegistration ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
            {allowUserRegistration ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Add New User / Member</h4>
            <p className="text-xs text-gray-500">Create a user account with custom credentials</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Nara Lokesh"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@tdp.org"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showUserPassword ? 'text' : 'password'}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowUserPassword(!showUserPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
            <input
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="user">Citizen / Party Member (User)</option>
              <option value="admin">Administrator (Admin)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">District</label>
            <input
              value={newUserDistrict}
              onChange={(e) => setNewUserDistrict(e.target.value)}
              placeholder="e.g. Guntur / Krishna"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            Required fields: <strong className="text-gray-600">Name, Email, Password</strong>
          </span>
          <button
            disabled={loading}
            onClick={handleCreateUser}
            className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Email & Phone', 'Role', 'Verification', 'District', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm text-gray-900">{u.name}</div>
                    {u.membershipId && (
                      <div className="text-[11px] text-yellow-700 font-mono font-medium">{u.membershipId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{u.email}</div>
                    {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {u.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {u.district || u.constituency ? (
                      <div>
                        {u.district && <span className="font-medium text-gray-800">{u.district}</span>}
                        {u.constituency && <span className="text-gray-400 ml-1">({u.constituency})</span>}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{String(u.createdAt || '').slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleBlockUser(u._id, u.status === 'active' ? 'blocked' : 'active')}
                        className="p-1.5 hover:bg-yellow-50 text-gray-500 hover:text-yellow-700 rounded-lg transition-colors"
                        title={u.status === 'active' ? 'Block User' : 'Unblock User'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBlogs = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Blog & Article Management</h3>
          <p className="text-xs text-gray-500">Publish news, party updates, and multimedia stories</p>
        </div>
        <button
          disabled={loading}
          onClick={() => loadTabData('blogs')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Add Blog Form with Media Support */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold text-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Create New Blog Post</h4>
            <p className="text-xs text-gray-500">Post articles with text, tags, and attached images/videos</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                placeholder="e.g. Amaravati Reconstruction Project Milestones Announced"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tags (Comma separated)
              </label>
              <input
                value={blogTags}
                onChange={(e) => setBlogTags(e.target.value)}
                placeholder="Development, Amaravati, TDP"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Blog Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              rows={4}
              placeholder="Write the full post description, news article, or press announcement..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
            />
          </div>

          {/* Media Attachments Section */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-blue-600" />
                  Media Attachments (Images & Videos)
                </span>
                <p className="text-[11px] text-gray-500">
                  Upload directly from your device or paste a web URL link.
                </p>
              </div>

              {/* Upload button */}
              <div className="flex items-center gap-2">
                <input
                  ref={blogFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handlePickBlogFiles(e.target.files)}
                />
                <button
                  type="button"
                  disabled={blogUploading}
                  onClick={() => blogFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {blogUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  {blogUploading ? 'Uploading...' : 'Upload Media File'}
                </button>
              </div>
            </div>

            {/* Link input */}
            <div className="flex gap-2">
              <input
                value={blogMediaLink}
                onChange={(e) => setBlogMediaLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBlogMediaLink();
                  }
                }}
                placeholder="Or paste direct image / video URL (e.g. https://...)"
                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddBlogMediaLink}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Link className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>

            {/* Attached media preview gallery */}
            {blogDraftMedia.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Attached Media ({blogDraftMedia.length})
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {blogDraftMedia.map((m, idx) => (
                    <div
                      key={idx}
                      className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs w-28 h-20 flex items-center justify-center"
                    >
                      {m.resourceType === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white rounded text-[9px] font-semibold uppercase">
                        {m.resourceType || 'image'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlogMedia(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 group-hover:opacity-100 hover:bg-red-700 transition-opacity"
                        title="Remove media"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            Required fields: <strong className="text-gray-600">Title, Content</strong>
          </span>
          <button
            disabled={loading || blogUploading}
            onClick={handleCreateBlog}
            className="flex items-center gap-1.5 px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Publish Blog
          </button>
        </div>
      </div>

      {/* Blogs List */}
      <div className="space-y-3">
        {blogs.map((blog) => (
          <div
            key={blog._id}
            className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-gray-200 transition-all"
          >
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              {blog?.media?.[0]?.url ? (
                <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-100">
                  {blog.media[0].resourceType === 'video' ? (
                    <video src={blog.media[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={blog.media[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                  {blog.media.length > 1 && (
                    <span className="absolute bottom-1 right-1 px-1 bg-black/70 text-white rounded text-[9px] font-bold">
                      +{blog.media.length - 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-16 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-gray-900 truncate">{blog.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{blog.content}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-gray-400">
                    {String(blog.createdAt || '').slice(0, 10)}
                  </span>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.map((t: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.2 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  {blog.media && blog.media.length > 0 && (
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {blog.media.length} media attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                disabled={loading}
                onClick={() => handleDeleteBlog(blog._id)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50 transition-colors"
                title="Delete Blog"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {blogs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No blog posts found.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPolls = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Poll Management</h3>
        <button onClick={() => loadTabData('polls')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Create Polls</h4>
            <p className="text-xs text-gray-500">Add multiple questions and options using the buttons</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={loading}
              onClick={() => setPollDrafts((prev) => [...prev, { question: '', options: ['', ''] }])}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Add Poll
            </button>
            <button
              disabled={loading}
              onClick={() => void handleCreateAllPolls()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Create All
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {pollDrafts.map((draft, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">Poll #{idx + 1}</p>
                <button
                  disabled={loading || pollDrafts.length === 1}
                  onClick={() => setPollDrafts((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <input
                value={draft.question}
                onChange={(e) =>
                  setPollDrafts((prev) => prev.map((p, i) => (i === idx ? { ...p, question: e.target.value } : p)))
                }
                placeholder="Poll question"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />

              <div className="mt-3 space-y-2">
                {(draft.options || []).map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) =>
                        setPollDrafts((prev) =>
                          prev.map((p, i) => {
                            if (i !== idx) return p;
                            const next = [...(p.options || [])];
                            next[j] = e.target.value;
                            return { ...p, options: next };
                          })
                        )
                      }
                      placeholder={`Option ${j + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      disabled={loading || (draft.options || []).length <= 2}
                      onClick={() =>
                        setPollDrafts((prev) =>
                          prev.map((p, i) => {
                            if (i !== idx) return p;
                            const next = (p.options || []).filter((_, k) => k !== j);
                            return { ...p, options: next };
                          })
                        )
                      }
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  disabled={loading}
                  onClick={() =>
                    setPollDrafts((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, options: [...(p.options || []), ''] } : p))
                    )
                  }
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  Add Option
                </button>
                <button
                  disabled={loading}
                  onClick={() => void handleCreatePollAt(idx)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {polls.map((p) => (
          <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">{p.question}</h4>
              <p className="text-xs text-gray-400">{String(p.createdAt || '').slice(0, 10)}</p>
            </div>
            <button disabled={loading} onClick={() => handleDeletePoll(p._id)} className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSurveys = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Survey Management</h3>
        <button onClick={() => loadTabData('surveys')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">Create Survey</h4>
            <p className="text-xs text-gray-500">Add any number of questions. Question type can be Text or Options.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={loading}
              onClick={() => setSurveyDraftQuestions((prev) => [...prev, { type: 'text', prompt: '', options: [] }])}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Add Question
            </button>
            <button
              disabled={loading}
              onClick={handleCreateSurvey}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Add Survey
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <input value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="Survey title" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>

        <div className="mt-4 space-y-4">
          {surveyDraftQuestions.map((q, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">Question #{idx + 1}</p>
                <button
                  disabled={loading || surveyDraftQuestions.length === 1}
                  onClick={() => setSurveyDraftQuestions((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={q.type}
                  onChange={(e) =>
                    setSurveyDraftQuestions((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, type: e.target.value === 'mcq' ? 'mcq' : 'text', options: e.target.value === 'mcq' ? (x.options?.length ? x.options : ['', '']) : [] } : x))
                    )
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="text">Text Answer</option>
                  <option value="mcq">Options</option>
                </select>
                <input
                  value={q.prompt}
                  onChange={(e) => setSurveyDraftQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, prompt: e.target.value } : x)))}
                  placeholder="Question prompt"
                  className="md:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              {q.type === 'mcq' && (
                <div className="mt-3">
                  <div className="space-y-2">
                    {(q.options || []).map((opt, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={(e) =>
                            setSurveyDraftQuestions((prev) =>
                              prev.map((x, i) => {
                                if (i !== idx) return x;
                                const next = [...(x.options || [])];
                                next[j] = e.target.value;
                                return { ...x, options: next };
                              })
                            )
                          }
                          placeholder={`Option ${j + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <button
                          disabled={loading || (q.options || []).length <= 2}
                          onClick={() =>
                            setSurveyDraftQuestions((prev) =>
                              prev.map((x, i) => {
                                if (i !== idx) return x;
                                const next = (x.options || []).filter((_, k) => k !== j);
                                return { ...x, options: next };
                              })
                            )
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <button
                      disabled={loading}
                      onClick={() => setSurveyDraftQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, options: [...(x.options || []), ''] } : x)))}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {surveys.map((s) => (
          <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">{s.title}</h4>
              <p className="text-xs text-gray-400">{String(s.createdAt || '').slice(0, 10)}</p>
            </div>
            <button disabled={loading} onClick={() => handleDeleteSurvey(s._id)} className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorks = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Development Works & Community Tasks</h3>
          <p className="text-xs text-gray-500">Track and manage local development works, civic issues, and constituency projects</p>
        </div>
        <button
          disabled={loading}
          onClick={() => loadTabData('works')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Add Work Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Add New Work Project / Task</h4>
            <p className="text-xs text-gray-500">Record a constituency initiative or community problem</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="grid md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Work Title <span className="text-red-500">*</span>
              </label>
              <input
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="e.g. Village Road Tarring & Streetlight Installation"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                Location <span className="text-red-500">*</span>
              </label>
              <input
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Ward 4, Mangalagiri / Vijayawada Rural"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={workCategory}
                onChange={(e) => setWorkCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Infrastructure">Infrastructure (Roads, Bridges, Buildings)</option>
                <option value="Utilities">Utilities (Drinking Water, Electricity, Sewage)</option>
                <option value="Community">Community & Public Halls</option>
                <option value="Education">Education & School Repairs</option>
                <option value="Healthcare">Healthcare & PHC Centers</option>
                <option value="Agriculture">Agriculture & Irrigation Canals</option>
                <option value="Welfare">Welfare & Housing</option>
                <option value="General">General / Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={workPriority}
                onChange={(e) => setWorkPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
              placeholder="Provide full details of the required work, background, and required action..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            Required fields: <strong className="text-gray-600">Work Title, Location, Description</strong>
          </span>
          <button
            disabled={loading}
            onClick={handleCreateWork}
            className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Work
          </button>
        </div>
      </div>

      {/* Works List */}
      <div className="space-y-3">
        {works.map((work) => (
          <div
            key={work._id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{work.title}</h4>
                  {work.category && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {work.category}
                    </span>
                  )}
                  {work.priority && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        work.priority === 'Urgent'
                          ? 'bg-red-100 text-red-700'
                          : work.priority === 'High'
                          ? 'bg-orange-100 text-orange-700'
                          : work.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {work.priority}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">{work.description}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1 text-gray-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {work.location || 'Location not specified'}
                  </span>
                  <span>•</span>
                  <span>{String(work.createdAt || '').slice(0, 10)}</span>
                  {work.user?.name && (
                    <>
                      <span>•</span>
                      <span>By: {work.user.name}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <select
                  value={work.status}
                  disabled={loading}
                  onChange={(e) => handleUpdateWorkStatus(work._id, e.target.value as any)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold bg-white disabled:opacity-50 ${
                    work.status === 'Open'
                      ? 'border-yellow-300 text-yellow-800 bg-yellow-50/50'
                      : work.status === 'In Progress'
                      ? 'border-blue-300 text-blue-800 bg-blue-50/50'
                      : work.status === 'Completed' || work.status === 'Found'
                      ? 'border-green-300 text-green-800 bg-green-50/50'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Found">Found</option>
                </select>

                <button
                  disabled={loading}
                  onClick={() => handleDeleteWork(work._id)}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50 transition-colors"
                  title="Delete Work"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {works.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No works or initiatives recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Group Management</h3>
        <button onClick={() => loadTabData('groups')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <select value={groupPublic ? 'public' : 'private'} onChange={(e) => setGroupPublic(e.target.value === 'public')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button disabled={loading} onClick={handleCreateGroup} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            Add Group
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">{g.name}</h4>
              <p className="text-xs text-gray-500">{g.isPublic ? 'Public' : 'Private'} • {g.membersCount || g.members?.length || 0} members</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void openGroupPreview(g)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-1" /> View
              </button>
              <button
                onClick={() => void handleDeleteGroup(g._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNewsletter = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Newsletter Subscribers</h3>
        <button onClick={() => loadTabData('newsletter')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.source || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(s.createdAt || '').slice(0, 19).replace('T', ' ')}</td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">No subscribers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChats = () => (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Chat Moderation</h3>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Manual Registration</h4>
            <p className="text-xs text-gray-500">
              Turn OFF to hide signup/register for normal users and allow only login/Google sign-in.
            </p>
          </div>
          <button
            type="button"
            disabled={updatingRegistrationSetting}
            onClick={handleToggleUserRegistration}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
              allowUserRegistration
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                allowUserRegistration ? 'bg-green-600' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  allowUserRegistration ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
            {allowUserRegistration ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-3">Search user</p>
            <div className="flex gap-2">
              <input
                value={adminChatUserQuery}
                onChange={(e) => setAdminChatUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void runAdminChatUserSearch()}
                placeholder="Name / Membership ID / Phone"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
              />
              <button
                onClick={() => void runAdminChatUserSearch()}
                disabled={loadingAdminChat}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Search
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {adminChatUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => void openAdminChatUser(String(u._id))}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                    String(adminChatTargetUserId) === String(u._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{u.membershipId || ''}</p>
                </button>
              ))}
              {adminChatUsers.length === 0 && (
                <p className="text-xs text-gray-500">Search a user to view their private chats.</p>
              )}
            </div>
          </div>

          {adminChatTargetUserId && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Conversations</p>
                <button
                  onClick={() => void openAdminChatUser(adminChatTargetUserId)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-auto">
                {adminChatConversations.map((c) => (
                  <button
                    key={c.otherUser?._id}
                    onClick={() => void openAdminChatThread(String(c.otherUser._id))}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                      String(adminChatActiveOtherUserId) === String(c.otherUser?._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.otherUser?.name || 'Member'}</p>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage?.text || ''}</p>
                  </button>
                ))}
                {adminChatConversations.length === 0 && (
                  <p className="text-xs text-gray-500">No private messages found for this user.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Messages</p>
              {loadingAdminChat && <p className="text-xs text-gray-500">Loading...</p>}
            </div>
            <div className="p-4 bg-gray-50 max-h-[520px] overflow-auto space-y-3">
              {adminChatMessages.map((m) => {
                const senderName = m?.from?.name || 'Member';
                const t = m?.createdAt ? new Date(m.createdAt) : new Date();
                return (
                  <div key={m._id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900">{senderName}</p>
                      <p className="text-[10px] text-gray-400">{t.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.text}</p>
                    {m.media?.url && (
                      <a href={m.media.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-2 inline-block">
                        View attachment
                      </a>
                    )}
                  </div>
                );
              })}
              {adminChatMessages.length === 0 && (
                <p className="text-sm text-gray-500">Select a conversation to view message history.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">System Alerts</h3>
        <button onClick={() => loadTabData('alerts')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={alertTitle}
            onChange={(e) => setAlertTitle(e.target.value)}
            placeholder="Alert title"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            placeholder="Alert message"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            disabled={loading}
            onClick={() => void handleCreateAlert()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Create Alert
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Title', 'Message', 'Active', 'Starts', 'Expires', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[520px] truncate">{a.message}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>{a.isActive ? 'active' : 'inactive'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(a.startsAt || '').slice(0, 10) || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{a.expiresAt ? String(a.expiresAt || '').slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(a.createdAt || '').slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={loading}
                    onClick={() => void handleDeleteAlert(a._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No alerts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Report Management</h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Type', 'Reporter', 'Target', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.targetType || 'Other'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r?.reporter?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(r.targetId)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                    r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{String(r.createdAt || '').slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button disabled={loading} onClick={() => handleReport(r._id, 'resolve')} className="p-1.5 hover:bg-green-50 rounded-lg disabled:opacity-50" title="Resolve"><CheckCircle className="w-3.5 h-3.5 text-green-500" /></button>
                    <button disabled={loading} onClick={() => handleReport(r._id, 'ignore')} className="p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Dismiss"><XCircle className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleCreateOrUpdateLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderName.trim()) {
      setError('Leader full name is required');
      return;
    }
    if (!leaderRole.trim()) {
      setError('Leader designation/role is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        name: leaderName.trim(),
        role: leaderRole.trim(),
        category: leaderCategory,
        photoUrl: leaderPhotoUrl.trim(),
        bio: leaderBio.trim(),
        constituency: leaderConstituency.trim(),
        district: leaderDistrict.trim(),
        trackInNews: Boolean(leaderTrackInNews),
        searchKeywords: leaderSearchKeywords.trim(),
        order: Number(leaderOrder) || 0,
      };

      if (editingLeaderId) {
        await api.authedRequest(`/api/leaders/${editingLeaderId}`, 'PATCH', payload);
        setLeaderSuccessMsg('Leadership member updated successfully!');
      } else {
        await api.authedRequest('/api/leaders', 'POST', payload);
        setLeaderSuccessMsg('New leadership member added successfully!');
      }

      // Reset form
      setEditingLeaderId(null);
      setLeaderName('');
      setLeaderRole('');
      setLeaderCategory('state_leadership');
      setLeaderPhotoUrl('');
      setLeaderBio('');
      setLeaderConstituency('');
      setLeaderDistrict('');
      setLeaderTrackInNews(true);
      setLeaderSearchKeywords('');
      setLeaderOrder(0);

      await loadTabData('leaders');
      setTimeout(() => setLeaderSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save leadership member');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLeader = (leader: any) => {
    setEditingLeaderId(leader._id);
    setLeaderName(leader.name || '');
    setLeaderRole(leader.role || '');
    setLeaderCategory(leader.category || 'state_leadership');
    setLeaderPhotoUrl(leader.photoUrl || '');
    setLeaderBio(leader.bio || '');
    setLeaderConstituency(leader.constituency || '');
    setLeaderDistrict(leader.district || '');
    setLeaderTrackInNews(leader.trackInNews !== false);
    setLeaderSearchKeywords(leader.searchKeywords || '');
    setLeaderOrder(leader.order || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelLeaderEdit = () => {
    setEditingLeaderId(null);
    setLeaderName('');
    setLeaderRole('');
    setLeaderCategory('state_leadership');
    setLeaderPhotoUrl('');
    setLeaderBio('');
    setLeaderConstituency('');
    setLeaderDistrict('');
    setLeaderTrackInNews(true);
    setLeaderSearchKeywords('');
    setLeaderOrder(0);
  };

  const handleToggleLeaderNewsTracking = async (id: string) => {
    setError('');
    try {
      await api.authedRequest(`/api/leaders/${id}/toggle-news`, 'PATCH', {});
      await loadTabData('leaders');
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle news tracking');
    }
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from Leadership?`)) return;
    setError('');
    setLoading(true);
    try {
      await api.authedRequest(`/api/leaders/${id}`, 'DELETE');
      await loadTabData('leaders');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete leader');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderPhotoFileUpload = async (file: File) => {
    if (!file) return;
    setLeaderPhotoUploading(true);
    setError('');
    try {
      const res = await api.uploadSingle(file);
      if (res?.file?.url) {
        setLeaderPhotoUrl(res.file.url);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload leader photo');
    } finally {
      setLeaderPhotoUploading(false);
      if (leaderFileInputRef.current) leaderFileInputRef.current.value = '';
    }
  };

  const handleTestLeaderNews = async (leader: any) => {
    setTestingLeaderNewsId(leader._id);
    setTestNewsLeaderName(leader.name);
    setTestNewsArticles(null);
    setError('');
    try {
      const res = await api.request<any>(
        `/api/news/leaders?leaderId=${encodeURIComponent(leader.slug || leader.name)}&limit=10`,
        'GET'
      );
      setTestNewsArticles(res?.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch live test news for leader');
    } finally {
      setTestingLeaderNewsId(null);
    }
  };

  const filteredLeaders = useMemo(() => {
    return leaders.filter((l) => {
      if (leaderViewMode === 'news_tracker' && !l.trackInNews) return false;
      if (leadershipCategoryFilter !== 'all' && l.category !== leadershipCategoryFilter) return false;
      if (leadersSearchQuery.trim()) {
        const q = leadersSearchQuery.toLowerCase().trim();
        const matchName = String(l.name || '').toLowerCase().includes(q);
        const matchRole = String(l.role || '').toLowerCase().includes(q);
        const matchDist = String(l.district || '').toLowerCase().includes(q);
        const matchConst = String(l.constituency || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchDist && !matchConst) return false;
      }
      return true;
    });
  }, [leaders, leaderViewMode, leadershipCategoryFilter, leadersSearchQuery]);

  const trackedCount = useMemo(() => leaders.filter((x) => x.trackInNews).length, [leaders]);

  const renderLeaders = () => (
    <div className="space-y-6">
      {/* Top Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-black text-gray-900">Party Leadership & News Members</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage key party leaders, cabinet ministers, and automated Google News tracking feeds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-center">
            <p className="text-xs text-blue-600 font-bold uppercase">Total Leaders</p>
            <p className="text-xl font-black text-blue-950">{leaders.length}</p>
          </div>
          <div className="px-4 py-2 bg-green-50 border border-green-100 rounded-xl text-center">
            <p className="text-xs text-green-600 font-bold uppercase">News Tracked</p>
            <p className="text-xl font-black text-green-950">{trackedCount}</p>
          </div>
        </div>
      </div>

      {/* Success Message Banner */}
      {leaderSuccessMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between text-sm text-green-800 font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>{leaderSuccessMsg}</span>
          </div>
          <button onClick={() => setLeaderSuccessMsg('')} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Leader Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-700">
              {editingLeaderId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">
                {editingLeaderId ? 'Edit Leadership Member' : 'Add New Leadership Member'}
              </h4>
              <p className="text-xs text-gray-500">
                {editingLeaderId
                  ? 'Update member profile, designation, or news search parameters'
                  : 'Add a new leader to the official directory and enable news crawler'}
              </p>
            </div>
          </div>
          {editingLeaderId && (
            <button
              onClick={handleCancelLeaderEdit}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleCreateOrUpdateLeader} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Leader Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="e.g. N. Chandrababu Naidu / Nara Lokesh"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Role / Designation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={leaderRole}
                onChange={(e) => setLeaderRole(e.target.value)}
                placeholder="e.g. Party National President & Chief Minister"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Leadership Category</label>
              <select
                value={leaderCategory}
                onChange={(e) => setLeaderCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              >
                <option value="state_leadership">State Leadership (Party Pres/GS)</option>
                <option value="national_leadership">National Leadership & Union Ministers</option>
                <option value="cabinet_ministers">State Cabinet Ministers</option>
                <option value="members_parliament">Members of Parliament (MP)</option>
                <option value="assembly_members">Legislative Members (MLA/MLC)</option>
                <option value="district_incharge">District Incharge / Presidents</option>
                <option value="youth_wing">Telugu Yuvatha (Youth Wing)</option>
                <option value="women_wing">Telugu Mahila (Women Wing)</option>
                <option value="other">Other Senior Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={leaderDistrict}
                onChange={(e) => setLeaderDistrict(e.target.value)}
                placeholder="e.g. Guntur / Chittoor / Srikakulam"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Constituency</label>
              <input
                type="text"
                value={leaderConstituency}
                onChange={(e) => setLeaderConstituency(e.target.value)}
                placeholder="e.g. Kuppam / Mangalagiri / Tekkali"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Photo upload & URL */}
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-blue-600" />
              Leader Photo / Avatar
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center flex-shrink-0">
                {leaderPhotoUrl ? (
                  <img src={leaderPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Award className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={leaderPhotoUrl}
                  onChange={(e) => setLeaderPhotoUrl(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:border-blue-500 outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={leaderFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleLeaderPhotoFileUpload(f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={leaderPhotoUploading}
                    onClick={() => leaderFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {leaderPhotoUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {leaderPhotoUploading ? 'Uploading...' : 'Upload Image File'}
                  </button>
                  <span className="text-[11px] text-gray-400">JPG, PNG, WebP supported</span>
                </div>
              </div>
            </div>
          </div>

          {/* News Tracking & Crawler Configuration */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Latest News Crawler Configuration
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={leaderTrackInNews}
                  onChange={(e) => setLeaderTrackInNews(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-blue-900">Track in Latest News Feed</span>
              </label>
            </div>

            {leaderTrackInNews && (
              <div className="grid md:grid-cols-3 gap-3 pt-2 border-t border-blue-100">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-blue-900 mb-1">
                    Custom News Search Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={leaderSearchKeywords}
                    onChange={(e) => setLeaderSearchKeywords(e.target.value)}
                    placeholder="e.g. Chandrababu Naidu TDP Andhra Pradesh CM"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-blue-700/80 mt-1">
                    Leave blank to automatically query Google News with leader's full name and party tags.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-blue-900 mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    value={leaderOrder}
                    onChange={(e) => setLeaderOrder(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-900 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-blue-700/80 mt-1">Lower numbers appear first (e.g. 1, 2, 3...)</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Bio / Profile Summary</label>
            <textarea
              rows={2}
              value={leaderBio}
              onChange={(e) => setLeaderBio(e.target.value)}
              placeholder="Brief biography, key political accomplishments, or ministry portfolio..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingLeaderId ? 'Update Leader Details' : 'Add Leadership Member'}
            </button>
            {editingLeaderId && (
              <button
                type="button"
                onClick={handleCancelLeaderEdit}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Test Live News Results Modal */}
      {testNewsArticles !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Live News Crawler Test</p>
                <h3 className="text-lg font-black text-gray-900">
                  Fetched News Articles for "{testNewsLeaderName}"
                </h3>
              </div>
              <button
                onClick={() => setTestNewsArticles(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto space-y-4 flex-1 bg-gray-50">
              {testNewsArticles.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium">
                    No articles found matching this leader's query currently. Check query keywords or retry.
                  </p>
                </div>
              ) : (
                testNewsArticles.map((art, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-sm"
                  >
                    <div className="w-full md:w-40 h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {art.imageUrl ? (
                        <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-bold mb-1">
                          {art.source || 'News Source'} • {art.pubDate ? new Date(art.pubDate).toLocaleDateString() : 'Recent'}
                        </p>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{art.title}</h4>
                        {art.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{art.description}</p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={art.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Open Source Article <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setTestNewsArticles(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Switcher & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeaderViewMode('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                leaderViewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Leadership ({leaders.length})
            </button>
            <button
              onClick={() => setLeaderViewMode('news_tracker')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                leaderViewMode === 'news_tracker'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              Latest News Tracked Members ({trackedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={leadersSearchQuery}
              onChange={(e) => setLeadersSearchQuery(e.target.value)}
              placeholder="Search by name, role, dist..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-blue-500 outline-none font-medium"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'state_leadership', label: 'State Leadership' },
            { id: 'national_leadership', label: 'National & Union' },
            { id: 'cabinet_ministers', label: 'Cabinet Ministers' },
            { id: 'members_parliament', label: 'MPs' },
            { id: 'assembly_members', label: 'MLAs / MLCs' },
            { id: 'district_incharge', label: 'District Incharges' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setLeadershipCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                leadershipCategoryFilter === cat.id
                  ? 'bg-yellow-400 text-blue-950 border-yellow-400 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leadership Table & Directory */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase">Leader</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase">Role & Category</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase">Region / Dist</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase">News Crawler</th>
                <th className="text-right px-4 py-3.5 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaders.map((leader) => {
                const isTestingThis = testingLeaderNewsId === leader._id;
                return (
                  <tr key={leader._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-yellow-400/20 border border-yellow-400 flex-shrink-0">
                          {leader.photoUrl ? (
                            <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-yellow-700 text-xs">
                              {leader.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{leader.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">slug: {leader.slug || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{leader.role}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {String(leader.category || 'state_leadership').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {leader.constituency ? (
                        <span className="font-semibold text-gray-900">{leader.constituency}</span>
                      ) : (
                        '—'
                      )}
                      {leader.district && (
                        <span className="text-gray-500 block text-[11px]">{leader.district} District</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLeaderNewsTracking(leader._id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            leader.trackInNews
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Click to toggle news tracking"
                        >
                          {leader.trackInNews ? '● News Tracked' : '○ Disabled'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={isTestingThis}
                          onClick={() => handleTestLeaderNews(leader)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Fetch and preview live news for this leader"
                        >
                          {isTestingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Newspaper className="w-3.5 h-3.5" />
                          )}
                          <span>Test News</span>
                        </button>
                        <button
                          onClick={() => handleEditLeader(leader)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          title="Edit leader"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLeader(leader._id, leader.name)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Delete leader"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeaders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500 font-medium">
                    No leadership members match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (error) {
      return <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>;
    }

    if (loading) {
      return <div className="text-center py-12"><p className="text-gray-500 font-medium">Loading...</p></div>;
    }

    switch (activeTab) {
      case 'dashboard': return renderUsers();
      case 'users': return renderUsers();
      case 'leaders': return renderLeaders();
      case 'blogs': return renderBlogs();
      case 'comments': return renderComments();
      case 'polls': return renderPolls();
      case 'surveys': return renderSurveys();
      case 'works': return renderWorks();
      case 'groups': return renderGroups();
      case 'group-requests': return renderGroupRequests();
      case 'community': return renderCommunityModeration();
      case 'call-records': return renderCallRecords();
      case 'auto-answer': return renderAutoAnswer();
      case 'alerts': return renderAlerts();
      case 'reports': return renderReports();
      case 'contacts': return renderContacts();
      case 'newsletter':
        return renderNewsletter();
      case 'chats':
        return renderChats();
      default: return renderUsers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage platform content, users, and analytics</p>
      </div>

      <AIInsightBanner text="Data analytics and moderation help leadership take informed actions. Real-time insights enable proactive governance and community management." />

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase">Sections</p>
            </div>
            <div className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          {renderContent()}
        </div>
      </div>

      {viewingGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Group</p>
                <h3 className="text-xl font-black text-gray-900 leading-snug">{viewingGroup.name}</h3>
              </div>
              <button
                onClick={() => setViewingGroup(null)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5 bg-gray-50 space-y-3">
              {loadingGroupPreview && <p className="text-sm text-gray-500">Loading...</p>}
              {!loadingGroupPreview && groupPreviewMessages.map((m) => (
                <div key={m._id} className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-900">{m?.from?.name || 'Member'}</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.text}</p>
                  {m.media?.url && (
                    <a href={m.media.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-2 inline-block">
                      View attachment
                    </a>
                  )}
                </div>
              ))}
              {!loadingGroupPreview && groupPreviewMessages.length === 0 && (
                <p className="text-sm text-gray-500">No messages found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
