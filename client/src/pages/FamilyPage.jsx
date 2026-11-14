import React, { useState, useEffect } from 'react';
import { api } from '../api/endpoints';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Mail,
  Heart,
  AlertCircle
} from 'lucide-react';

export function FamilyPage() {
  const [data, setData] = useState({
    my_guardians: [],
    people_i_protect: [],
    pending_invites_for_me: []
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [error, setError] = useState(null);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.guardians.getAll();
      if (res) {
        setData({
          my_guardians: res.my_guardians || [],
          people_i_protect: res.people_i_protect || [],
          pending_invites_for_me: res.pending_invites_for_me || []
        });
      }
    } catch (err) {
      console.error('Failed to load guardians:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    try {
      await api.guardians.invite(inviteEmail.trim());
      setInviteSuccess(true);
      setInviteEmail('');
      await loadGuardians();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      setError(err);
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvite = async (id) => {
    try {
      await api.guardians.accept(id);
      await loadGuardians();
    } catch (err) {
      alert('Failed to accept invite: ' + (err.message || 'Error occurred'));
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this family connection?')) {
      return;
    }
    try {
      await api.guardians.delete(id);
      await loadGuardians();
    } catch (err) {
      alert('Failed to remove guardian: ' + (err.message || 'Error occurred'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-navy-50 text-navy-900 border border-navy-200 text-sm font-bold">
          <Heart className="w-4 h-4 text-rose-500 fill-current" />
          <span>Family Safety Net</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950">
          Family Guardians & Protected Members
        </h1>
        <p className="text-lg text-slate-700 font-medium max-w-2xl">
          When an elderly parent or family member receives a scam call or malicious KYC link, their appointed guardians are alerted immediately.
        </p>
      </div>

      <ErrorBox error={error} />

      {/* Invite a Guardian Form */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-navy-950">
              Invite a Guardian
            </h2>
            <p className="text-sm text-slate-700 font-medium">
              Add a trusted son, daughter, brother, or friend to watch over your account.
            </p>
          </div>
        </div>

        {inviteSuccess && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Invitation sent successfully! They will appear in your guardians list.</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. rohan.patel@gmail.com"
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border-2 border-slate-300 text-lg font-medium focus:border-navy-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="min-h-[50px] px-6 py-3 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-lg shadow transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Mail className="w-5 h-5" />
            <span>{inviting ? 'Sending Invite...' : 'Send Invite'}</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200">
          <Loader message="Loading your family circle..." />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Invites for Me (if any) */}
          {data.pending_invites_for_me && data.pending_invites_for_me.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-black">
                  Pending Guardian Requests ({data.pending_invites_for_me.length})
                </h3>
              </div>
              <p className="text-sm font-semibold text-amber-900">
                The following family members have asked you to protect them:
              </p>

              <div className="space-y-2">
                {data.pending_invites_for_me.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {item.other_user?.name || 'Family Member'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {item.other_user?.email}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcceptInvite(item.id)}
                      className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow"
                    >
                      Accept & Protect Them
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: People I Protect */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-2xl font-black text-navy-950">
                  People I Protect ({data.people_i_protect.length})
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 font-medium">
              You will automatically receive an instant high-priority alert whenever these family members encounter a high-risk scam call or phishing message.
            </p>

            {data.people_i_protect.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 font-semibold">
                You are not currently protecting anyone. Ask your parents or relatives to add your email as their Guardian.
              </div>
            ) : (
              <div className="space-y-2">
                {data.people_i_protect.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {item.other_user?.name || 'Family Member'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {item.other_user?.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full">
                        {item.status || 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        aria-label="Remove protected member"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: My Guardians */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-navy-900" />
                <h3 className="text-2xl font-black text-navy-950">
                  My Guardians ({data.my_guardians.length})
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 font-medium">
              These trusted contacts receive an alert if you encounter a high-severity scam or dangerous fake police call.
            </p>

            {data.my_guardians.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 font-semibold">
                You haven't added any guardians yet. Invite a trusted family member above.
              </div>
            ) : (
              <div className="space-y-2">
                {data.my_guardians.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {item.other_user?.name || 'Guardian'}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {item.other_user?.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full ${
                        item.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status || 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        aria-label="Remove guardian"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
