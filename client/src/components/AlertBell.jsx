import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../api/endpoints';

export function AlertBell({ unreadCount: propCount }) {
  const [unreadCount, setUnreadCount] = useState(propCount || 0);

  useEffect(() => {
    if (typeof propCount === 'number') {
      setUnreadCount(propCount);
      return;
    }

    let isMounted = true;
    async function fetchAlerts() {
      try {
        const res = await api.alerts.getAll();
        if (isMounted && res) {
          setUnreadCount(res.unread_count || 0);
        }
      } catch (e) {
        // quiet error on bell poll
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [propCount]);

  return (
    <Link
      to="/alerts"
      className="relative flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl text-slate-700 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-navy-900"
      aria-label={`Family Alerts (${unreadCount} unread)`}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse border-2 border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
