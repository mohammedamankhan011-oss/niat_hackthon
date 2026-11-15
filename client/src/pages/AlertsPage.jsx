import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { VerdictBadge } from '../components/VerdictBadge';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import { getScamTypeLabel } from '../utils/scamTypeLabels';
import {
  Bell,
  CheckCircle,
  PhoneCall,
  MessageSquare,
  FileImage,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCheck
} from 'lucide-react';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.alerts.getAll();
      if (res?.alerts) {
        setAlerts(res.alerts);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.alerts.markRead(id);
      setAlerts(prev =>
        prev.map(a => (a.id === id ? { ...a, is_read: true } : a))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Mark read failed:', err);
    }
  };

  const getInputIcon = (type) => {
    if (type === 'call') return <PhoneCall className="w-5 h-5 text-red-600" />;
    if (type === 'image') return <FileImage className="w-5 h-5 text-indigo-600" />;
    return <MessageSquare className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-950 flex items-center gap-3">
            <Bell className="w-8 h-8 text-red-600" />
            <span>Family Guardian Alerts</span>
          </h1>
          <p className="text-base text-slate-700 font-medium mt-1">
            Real-time security alerts triggered when someone in your family encounters a scam
          </p>
        </div>

        {unreadCount > 0 && (
          <span className="px-4 py-1.5 bg-red-100 text-red-900 border border-red-300 font-black rounded-full text-sm flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            {unreadCount} Unread Alert{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ErrorBox error={error} />

      {loading ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 border border-slate-200">
          <Loader message="Loading family safety alerts..." />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-2xl font-black text-slate-900">
            All Clear! No Active Alerts
          </h3>
          <p className="text-slate-600 max-w-md mx-auto font-medium">
            No one in your family circle has encountered any high-risk scams recently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl p-6 border-2 transition-all shadow-sm ${
                alert.is_read
                  ? 'bg-white/90 backdrop-blur-sm border-slate-200 opacity-85'
                  : 'bg-red-50/90 backdrop-blur-sm border-red-300 shadow-md ring-1 ring-red-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 mt-1 ${
                    alert.is_read ? 'bg-slate-100' : 'bg-red-100 text-red-600'
                  }`}>
                    {getInputIcon(alert.scan?.input_type)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {!alert.is_read && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white">
                          NEW ALERT
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {alert.scan?.scam_type && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {getScamTypeLabel(alert.scan.scam_type)}
                        </span>
                      )}
                    </div>

                    {/* Headline: e.g. "Amma got a SCAM call: digital arrest, 96%" */}
                    <h3 className="text-xl font-black text-navy-950 leading-snug">
                      <span className="text-red-700 font-black">
                        {alert.person?.name || 'Family Member'}
                      </span>{' '}
                      got a {alert.scan?.risk_score >= 80 ? 'DANGEROUS SCAM' : 'SUSPICIOUS'}{' '}
                      {alert.scan?.input_type === 'call' ? 'call' : 'message'}:{' '}
                      <span className="italic font-bold">"{alert.scan?.summary}"</span>
                    </h3>

                    <div className="text-sm font-semibold text-slate-600">
                      Risk Score: {alert.scan?.risk_score}/100
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto justify-between sm:justify-end">
                  {!alert.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="min-h-[48px] px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors border border-slate-300"
                    >
                      Mark Read
                    </button>
                  )}

                  {alert.scan?.id && (
                    <Link
                      to={`/scans/${alert.scan.id}`}
                      className="min-h-[48px] px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-sm shadow flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Scan Report</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
