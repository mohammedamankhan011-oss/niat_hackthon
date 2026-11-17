import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { VerdictBadge } from '../components/VerdictBadge';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import { getScamTypeLabel } from '../utils/scamTypeLabels';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Trash2,
  Filter,
  MessageSquare,
  FileImage,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  X
} from 'lucide-react';

export function HistoryPage() {
  const { language } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState('all'); // all, scam, suspicious, safe
  const [typeFilter, setTypeFilter] = useState('all'); // all, text, image, call

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    async function loadScans() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.scans.getAll();
        if (res?.scans) {
          setScans(res.scans);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadScans();
  }, []);

  // Memoized filtered scans
  const filteredScans = useMemo(() => {
    let result = scans;
    if (verdictFilter !== 'all') {
      result = result.filter(s => s.risk_level === verdictFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter(s => s.input_type === typeFilter);
    }
    return result;
  }, [verdictFilter, typeFilter, scans]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.scans.delete(deleteTarget.id);
      setScans(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Failed to delete scan: ' + (err.message || 'Error occurred'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getInputIcon = (type) => {
    if (type === 'image') return <FileImage className="w-5 h-5 text-indigo-600" />;
    if (type === 'call') return <PhoneCall className="w-5 h-5 text-red-600" />;
    return <MessageSquare className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-950 flex items-center gap-3">
            <History className="w-8 h-8 text-navy-900" />
            <span>Scan & Call History</span>
          </h1>
          <p className="text-base text-slate-700 font-medium mt-1">
            Review all previous message checks and Live Call Guard transcripts
          </p>
        </div>

        <Link
          to="/scan"
          className="min-h-[48px] px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-base shadow flex items-center justify-center gap-2 self-start sm:self-auto transition-colors"
        >
          + New Check
        </Link>
      </div>

      <ErrorBox error={error} />

      {/* Filter Controls Bar */}
      <div className="bg-white/95 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="w-4 h-4 text-navy-900" />
          <span>Filter records by verdict & input type:</span>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Verdict Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Verdict:</span>
            {[
              { id: 'all', label: 'All Verdicts' },
              { id: 'scam', label: '🚨 Scam' },
              { id: 'suspicious', label: '⚠️ Suspicious' },
              { id: 'safe', label: '✅ Looks Safe' }
            ].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVerdictFilter(v.id)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                  verdictFilter === v.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1">Type:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'text', label: 'Text/SMS' },
              { id: 'image', label: 'Screenshots' },
              { id: 'call', label: '📞 Calls' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                  typeFilter === t.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="bg-white/95 rounded-3xl p-12 border border-slate-200">
          <Loader message="Loading safety records..." />
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-white/95 rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">No records found</h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            {scans.length === 0
              ? 'You have not performed any safety checks yet.'
              : 'No scans match your current filter settings.'}
          </p>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 bg-navy-900 text-white font-bold rounded-xl"
          >
            Start a new scan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 border-2 border-slate-200 hover:border-navy-900 rounded-2xl p-5 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <Link
                to={`/scans/${item.id}`}
                className="flex items-start gap-4 flex-1 focus:outline-none"
              >
                <div className="p-3 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                  {getInputIcon(item.input_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {item.input_type.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {getScamTypeLabel(item.scam_type, language)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-navy-900 leading-snug">
                    {item.summary}
                  </h3>
                </div>
              </Link>

              {/* Verdict badge and Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <VerdictBadge
                  riskLevel={item.risk_level}
                  score={item.risk_score}
                  size="sm"
                />

                <Link
                  to={`/scans/${item.id}`}
                  className="min-h-[48px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl font-bold text-sm flex items-center gap-1"
                >
                  <span>View</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  aria-label="Delete this scan record"
                  className="min-h-[48px] min-w-[48px] p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border-2 border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertOctagon className="w-8 h-8" />
              <h3 className="text-2xl font-black text-navy-950">
                Delete Scan Record?
              </h3>
            </div>

            <p className="text-base text-slate-700 font-medium">
              Are you sure you want to permanently delete this scan record? This action cannot be undone.
            </p>

            <div className="bg-slate-100 p-3 rounded-xl text-sm font-bold text-slate-800 line-clamp-2">
              "{deleteTarget.summary}"
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[48px] px-5 py-2.5 text-slate-700 font-bold rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="min-h-[48px] px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
