// Displays charts and graphs showing cash flows, milestone metrics, and project categories.
// Renders comprehensive metric summaries.


import { useState, useEffect, useMemo } from 'react';

// Components
import AnalyticsCard from './components/AnalyticsCard';
import SectionHeader from './components/SectionHeader';
import TabNavigation from './components/TabNavigation';

// Charts
import PieChartCard from './charts/PieChartCard';
import BarChartCard from './charts/BarChartCard';

// Data helpers + API
import {
  analyticsTabs,
  buildQuickStats,
  buildSections,
} from './data/analyticsData';
import { getAnalyticsStats } from '../../../services/analyticsService';

function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiData, setApiData] = useState(null);

  // ── Fetch analytics on mount ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getAnalyticsStats();
        if (!cancelled) {
          setApiData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Failed to load analytics data'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Transform API data into component props ────────────────
  const quickStats = useMemo(
    () => (apiData ? buildQuickStats(apiData) : []),
    [apiData]
  );

  const allSections = useMemo(
    () => (apiData ? buildSections(apiData) : []),
    [apiData]
  );

  // Filter sections by active tab
  const visibleSections = useMemo(() => {
    if (activeTab === 'Overview') return allSections;
    return allSections.filter((section) =>
      section.tabs.includes(activeTab)
    );
  }, [activeTab, allSections]);

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-semibold text-slate-500">
            Loading analytics…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="mb-1">
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
          Analytics Overview
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Monitor key metrics, project health, and financial performance.
        </p>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <TabNavigation
        tabs={analyticsTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ── Error Banner ────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* ── Quick Stats Grid — only on Overview ──────────── */}
      {activeTab === 'Overview' && quickStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {quickStats.map((stat) => (
            <AnalyticsCard key={stat.id} {...stat} />
          ))}
        </div>
      )}

      {/* ── Section-wise Charts ──────────────────────────────── */}
      <div className="space-y-8">
        {visibleSections.length === 0 && !error && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <p className="text-sm text-[#94A3B8]">
              No analytics sections for this tab.
            </p>
          </div>
        )}

        {visibleSections.map((section) => (
          <section key={section.id}>
            <SectionHeader
              title={section.title}
              iconName={section.iconName}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PieChartCard
                title={section.pieChart.title}
                data={section.pieChart.data}
              />
              <BarChartCard
                title={section.barChart.title}
                data={section.barChart.data}
                dataKey={section.barChart.dataKey}
                xKey={section.barChart.xKey}
                color={section.barChart.color}
                badge={section.barChart.badge}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsPage;
