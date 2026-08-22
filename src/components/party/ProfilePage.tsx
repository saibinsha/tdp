import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import AIInsightBanner from './AIInsightBanner';
import {
  User, MapPin, Phone, Mail, Calendar, Shield, Edit3, Camera, Save,
  Lock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

import { api } from '@/lib/api';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setShowLoginModal, logout, updateProfile } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    district: user?.district || '',
    constituency: user?.constituency || '',
    address: user?.address || '',
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        district: user.district || '',
        constituency: user.constituency || '',
        address: user.address || '',
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-4">Profile</h1>
        <AIInsightBanner text="Digital identity empowers members with verified participation. Your profile represents your commitment to democratic engagement." />
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sign in to view your profile</h3>
          <button onClick={() => setShowLoginModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Sign In</button>
        </div>
      </div>
    );
  }

  const handlePrintCard = () => {
    window.print();
  };

  const memberSince = user.joinedDate ? new Date(user.joinedDate) : null;
  const memberSinceText = memberSince ? memberSince.toLocaleDateString() : 'N/A';
  const canEditIdentity = !user.createdByAdmin;
  const verificationText = user.isVerified ? 'Verified Member' : 'Not Verified';

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setSaving(true);
    try {
      await updateProfile({
        ...(canEditIdentity ? { name: editData.name.trim(), phone: editData.phone.trim() } : {}),
        district: editData.district.trim(),
        constituency: editData.constituency.trim(),
        address: editData.address.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditing(false);
      }, 1200);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePickProfilePhoto = async (file: File) => {
    if (!file) return;
    setSaveError('');
    setUploadingPhoto(true);
    try {
      const uploaded = await api.uploadSingle(file);
      await updateProfile({ profilePicture: uploaded.file.url });
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-card-wrap { display: block !important; }
          .print-card { break-inside: avoid; }
        }
      `}</style>
      <h1 className="text-3xl font-black text-gray-900 mb-4">My Profile</h1>
      <AIInsightBanner text="Digital identity empowers members with verified participation. Your profile represents your commitment to democratic engagement and community building." />

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm mt-6 no-print">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-10">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePickProfilePhoto(f);
                }}
              />
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-blue-900 text-3xl font-black border-4 border-white shadow-lg overflow-hidden">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.avatar
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 shadow-sm no-print">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
          {editing && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" /> {canEditIdentity ? 'Email remains locked' : 'Name, Email & Phone are locked for admin-created accounts'}
            </span>
          )}
        </div>

        {editing ? (
          <div className="space-y-5">
            {/* Identity Fields */}
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-gray-500" />
                Identity Information
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  {canEditIdentity ? (
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  ) : (
                    <div className="w-full px-3.5 py-2.5 bg-gray-100/90 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-not-allowed select-none">
                      {user.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center justify-between">
                    <span>Email Address</span>
                    <Lock className="w-3 h-3 text-gray-400" />
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-gray-100/90 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-not-allowed select-none truncate">
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                  {canEditIdentity ? (
                    <input
                      type="text"
                      value={editData.phone}
                      onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  ) : (
                    <div className="w-full px-3.5 py-2.5 bg-gray-100/90 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium cursor-not-allowed select-none">
                      {user.phone || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Regional & Address Fields */}
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Regional & Residential Details (Editable)
              </p>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      District <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editData.district}
                      onChange={(e) => setEditData((p) => ({ ...p, district: e.target.value }))}
                      placeholder="e.g. Guntur / Krishna / Visakhapatnam"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Constituency <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editData.constituency}
                      onChange={(e) => setEditData((p) => ({ ...p, constituency: e.target.value }))}
                      placeholder="e.g. Mangalagiri / Kuppam / Vijayawada Central"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Complete Address / Street
                  </label>
                  <textarea
                    rows={2}
                    value={editData.address}
                    onChange={(e) => setEditData((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Enter complete door no, street name, landmark, village/ward..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Profile updated successfully! Membership card details refreshed.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Shield, label: 'Membership ID', value: user.membershipId || '—' },
              { icon: User, label: 'Full Name', value: user.name },
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Phone', value: user.phone || 'Not set' },
              { icon: MapPin, label: 'District', value: user.district || 'Not set' },
              { icon: MapPin, label: 'Constituency', value: user.constituency || 'Not set' },
              { icon: MapPin, label: 'Address', value: user.address || 'Not set' },
              { icon: Calendar, label: 'Member Since', value: user.joinedDate || 'N/A' },
              { icon: Shield, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
              { icon: Shield, label: 'Verification', value: verificationText },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 shadow-sm print-card-wrap">
        <div className="flex items-start justify-between gap-3 mb-4 no-print">
          <div>
            <h3 className="text-lg font-bold text-gray-900">TDP Membership Card</h3>
            <p className="text-xs text-gray-500">get your membership card from your profile details</p>
          </div>
          <button
            onClick={handlePrintCard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Print / Save
          </button>
        </div>

        <div className="print-card max-w-md mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider">TELUGU DESAM PARTY</p>
                <p className="text-[10px] opacity-90">DIGITAL MEMBERSHIP CARD</p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-yellow-400 text-blue-900 text-[10px] font-black">
                ACTIVE
              </div>
            </div>
          </div>

          <div className="p-5 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-gray-700">{user.avatar}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">
                  ID: {user.membershipId || '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-[10px] text-gray-400">Phone</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{user.phone || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Member Since</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{memberSinceText}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">District</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{user.district || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Constituency</p>
                <p className="text-xs font-semibold text-gray-900 truncate">{user.constituency || '—'}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] text-gray-400">Address</p>
              <p className="text-xs font-semibold text-gray-900">{user.address || '—'}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400">Role</p>
                <p className="text-xs font-bold text-gray-900 uppercase">{user.role}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">Verification</p>
                <p className={`text-xs font-bold ${user.isVerified ? 'text-green-700' : 'text-amber-700'}`}>
                  {user.isVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-500">This card is generated from your profile. Update details in profile to refresh.</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6 mt-6 no-print">
        <h3 className="text-lg font-bold text-red-600 mb-3">Account Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={logout} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">
            Sign Out
          </button>
          <button className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200">
            Download My Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
