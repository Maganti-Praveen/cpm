// Visualizes projected cash flows, revenue allocations, and financial predictions on administrative dashboards.
// Combines charts cards, date filters, and predictive indicators.

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Percent,
  AlertCircle,
  FileText,
  Users,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  ListOrdered,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  getRevenueOverview,
  getRevenueTrends,
  getRevenueForecast,
  getCustomForecast,
  getTopClients,
  getRevenueSources,
  getInsights
} from '../../../services/revenueService';

function RevenueForecast() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data States
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [sources, setSources] = useState([]);
  const [insights, setInsights] = useState([]);

  // Filter States
  const forecastMethod = 'LR';
  const [forecastPeriod, setForecastPeriod] = useState('3M'); // 1M, 3M, 6M, 12M, Custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customForecastData, setCustomForecastData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState('');

  // ── Load Initial Dashboard Data ──────────────────────────
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          overviewRes,
          trendsRes,
          forecastRes,
          topClientsRes,
          sourcesRes,
          insightsRes
        ] = await Promise.all([
          getRevenueOverview(forecastMethod),
          getRevenueTrends(),
          getRevenueForecast(forecastMethod),
          getTopClients(),
          getRevenueSources(),
          getInsights()
        ]);

        setOverview(overviewRes.data.data);
        setTrends(trendsRes.data.data);
        setForecast(forecastRes.data.data);
        setTopClients(topClientsRes.data.data);
        setSources(sourcesRes.data.data);
        setInsights(insightsRes.data.data);
      } catch (err) {
        console.error('Error loading revenue forecasting data:', err);
        setError(err.response?.data?.message || 'Failed to load revenue forecasting & analytics data');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadDashboardData();
    }, 100);
    return () => clearTimeout(timer);
  }, [forecastMethod]);

  // ── Custom Range Setup & Validation ──────────────────────
  const minForecastMonthStr = React.useMemo(() => {
    if (trends.length === 0) return '';
    const lastHistory = trends[trends.length - 1]; // e.g. { year: 2026, monthNum: 5 }
    let nextMonth = lastHistory.monthNum + 1;
    let nextYear = lastHistory.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const nextMonthPadded = String(nextMonth + 1).padStart(2, '0');
    return `${nextYear}-${nextMonthPadded}`;
  }, [trends]);

  // Auto-prefill custom range with default future months (next 3 months)
  useEffect(() => {
    if (minForecastMonthStr && !customStart) {
      setCustomStart(minForecastMonthStr);
      const [year, month] = minForecastMonthStr.split('-').map(Number);
      let endMonth = month + 2; // e.g. if start is 7, end is 9 (3 months total: 7, 8, 9)
      let endYear = year;
      if (endMonth > 12) {
        endMonth -= 12;
        endYear += 1;
      }
      const endMonthPadded = String(endMonth).padStart(2, '0');
      setCustomEnd(`${endYear}-${endMonthPadded}`);
    }
  }, [minForecastMonthStr, customStart]);

  // ── Handle Custom Forecast Submission ──────────────────────
  const handleCustomForecastSubmit = React.useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end months');
      return;
    }
    if (minForecastMonthStr && customStart < minForecastMonthStr) {
      setCustomError(`Custom forecast range must begin on or after the first forecast month (${minForecastMonthStr})`);
      return;
    }
    try {
      setCustomLoading(true);
      setCustomError('');
      const res = await getCustomForecast(customStart, customEnd, forecastMethod);
      setCustomForecastData(res.data.data);
    } catch (err) {
      console.error('Custom forecast request failed:', err);
      setCustomError(err.response?.data?.message || 'Failed to calculate custom range forecast');
      setCustomForecastData(null);
    } finally {
      setCustomLoading(false);
    }
  }, [customStart, customEnd, forecastMethod, minForecastMonthStr]);

  // Auto-update custom forecast when method changes
  useEffect(() => {
    if (forecastPeriod === 'Custom' && customStart && customEnd) {
      handleCustomForecastSubmit();
    }
  }, [forecastMethod, forecastPeriod, handleCustomForecastSubmit]);

  // ── Transform data for Combined actual vs forecast chart ────
  const projectionChartData = React.useMemo(() => {
    if (trends.length === 0 || !forecast) return [];

    // We take the last 6 months of historical actual data
    const recentHistory = trends.slice(-6).map((item) => ({
      name: item.monthLabel,
      actual: item.revenue,
      projected: null,
      type: 'Actual'
    }));

    // Choose active forecast segment based on toggle
    let futureProjections = [];
    if (forecastPeriod === '1M' && forecast.rawForecast.length > 0) {
      futureProjections = forecast.rawForecast.slice(0, 1);
    } else if (forecastPeriod === '3M') {
      futureProjections = forecast.next3Months.breakdown;
    } else if (forecastPeriod === '6M') {
      futureProjections = forecast.next6Months.breakdown;
    } else if (forecastPeriod === '12M') {
      futureProjections = forecast.next12Months.breakdown;
    } else if (forecastPeriod === 'Custom' && customForecastData) {
      futureProjections = customForecastData.breakdown;
    } else {
      // Default fallback
      futureProjections = forecast.next3Months.breakdown;
    }

    const projectedData = futureProjections.map((item) => ({
      name: item.monthLabel,
      actual: null,
      projected: item.revenue,
      type: 'Forecast'
    }));

    // For smooth visual transition, link the last actual point to the first forecast point
    if (recentHistory.length > 0 && projectedData.length > 0) {
      projectedData[0].actual = recentHistory[recentHistory.length - 1].actual;
    }

    return [...recentHistory, ...projectedData];
  }, [trends, forecast, forecastPeriod, customForecastData]);

  const firstForecastMonth = React.useMemo(() => {
    if (trends.length === 0 || !forecast) return null;
    let futureProjections = [];
    if (forecastPeriod === '1M' && forecast.rawForecast.length > 0) {
      futureProjections = forecast.rawForecast.slice(0, 1);
    } else if (forecastPeriod === '3M') {
      futureProjections = forecast.next3Months.breakdown;
    } else if (forecastPeriod === '6M') {
      futureProjections = forecast.next6Months.breakdown;
    } else if (forecastPeriod === '12M') {
      futureProjections = forecast.next12Months.breakdown;
    } else if (forecastPeriod === 'Custom' && customForecastData) {
      futureProjections = customForecastData.breakdown;
    } else {
      futureProjections = forecast.next3Months.breakdown;
    }
    return futureProjections[0]?.monthLabel || null;
  }, [trends, forecast, forecastPeriod, customForecastData]);

  // Formatter helpers
  const formatINR = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-500">Loading Revenue Intelligence Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-[1.875rem] font-bold text-slate-900 font-display">
            Revenue Forecast
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Perform strategic predictive forecasting, monitor core KPIs, and review business intelligence observations.
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-sm">
          <span className="text-xs font-bold text-slate-950">Forecast Model</span>
          <span className="text-[10px] font-semibold text-slate-600">
            {forecastMethod === "WMA" && "Weighted Moving Average"}
            {forecastMethod === "MA" && "Moving Average (3-Month)"}
            {forecastMethod === "LR" && "Linear Regression"}
          </span>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-800">Critical Error</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Section 1: Revenue Overview Cards ────────────────── */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Invoiced */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.totalInvoiced)}</h3>
            <p className="text-xs text-slate-500 mt-1">Total billing amount generated</p>
          </div>

          {/* Card 2: Current Month Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.thisMonthRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-1">Total revenue generated this month</p>
          </div>

          {/* Card 3: Monthly Growth Rate */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Growth Rate</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <h3 className={`text-2xl font-bold mt-4 ${overview.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overview.growthRate >= 0 ? `+${overview.growthRate}%` : `${overview.growthRate}%`}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Monthly trend indicator</p>
          </div>

          {/* Card 4: Forecast Accuracy */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Confidence</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{overview.forecastAccuracy}%</h3>
            <div className="flex items-center gap-1 mt-1" title="Calculated using R² score from historical revenue trends">
              <span className="text-xs font-medium text-slate-500 border-b border-dashed border-slate-300 cursor-help">
                Model quality fit (R² score)
              </span>
            </div>
          </div>

          {/* Card 5: Paid Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Revenue</span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.totalRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-1">Total successful payments received</p>
          </div>

          {/* Card 6: Average Invoice Value */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Invoice Value</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.averageInvoiceValue)}</h3>
            <p className="text-xs text-slate-500 mt-1">Average billed invoice amount</p>
          </div>

          {/* Card 7: Pending Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invoices</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.pendingInvoices)}</h3>
            <p className="text-xs text-slate-500 mt-1">Outstanding unpaid accounts</p>
          </div>

          {/* Card 8: Previous Month */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Month</span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">{formatINR(overview.prevMonthRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-1">Completed earnings last month</p>
          </div>
        </div>
      )}

      {/* ── Section 2: Projections & Controls ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Forecast Controls & Table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Calendar className="text-indigo-500 w-5 h-5" />
              <h3 className="text-md font-bold text-slate-950 font-display">Forecast Projections</h3>
            </div>



            {/* Toggle Buttons */}
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg mb-6">
              {['1M', '3M', '6M', '12M', 'Custom'].map((p) => (
                <button
                  key={p}
                  onClick={() => setForecastPeriod(p)}
                  className={`py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${forecastPeriod === p
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Custom Input Fields */}
            {forecastPeriod === 'Custom' && (
              <form onSubmit={handleCustomForecastSubmit} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Month</label>
                    <input
                      type="month"
                      value={customStart}
                      min={minForecastMonthStr}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                      aria-label="Start Month"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Month</label>
                    <input
                      type="month"
                      value={customEnd}
                      min={customStart || minForecastMonthStr}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                      aria-label="End Month"
                    />
                  </div>
                </div>
                {customError && <p className="text-[11px] font-medium text-rose-600">{customError}</p>}
                <button
                  type="submit"
                  disabled={customLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer transition-colors duration-150 disabled:opacity-50"
                >
                  {customLoading ? 'Calculating Projections...' : 'Generate Projections'}
                </button>
              </form>
            )}

            {/* Active Projections Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <div>
                  <span className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Projected Sum</span>
                  <h4 className="text-xl font-bold text-indigo-900 mt-1">
                    {forecast && forecastPeriod === '1M' && formatINR(forecast.nextMonth)}
                    {forecast && forecastPeriod === '3M' && formatINR(forecast.next3Months.total)}
                    {forecast && forecastPeriod === '6M' && formatINR(forecast.next6Months.total)}
                    {forecast && forecastPeriod === '12M' && formatINR(forecast.next12Months.total)}
                    {forecastPeriod === 'Custom' && customForecastData && formatINR(customForecastData.totalProjected)}
                    {forecastPeriod === 'Custom' && !customForecastData && '₹0.00'}
                  </h4>
                </div>
                <div className="bg-white border border-indigo-100 rounded-lg px-2.5 py-1 text-center">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Confidence</span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {forecastPeriod === 'Custom' && customForecastData ? customForecastData.confidence : forecast?.confidence}%
                  </span>
                </div>
              </div>

              {/* Table details */}
              <div className="max-h-[160px] overflow-y-auto no-scrollbar border border-slate-100 rounded-xl">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2">Month</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                    {forecast && forecastPeriod === '1M' && (
                      <tr>
                        <td className="px-4 py-2">{forecast.next3Months.breakdown[0]?.monthLabel}</td>
                        <td className="px-4 py-2 text-right">{formatINR(forecast.nextMonth)}</td>
                      </tr>
                    )}
                    {forecast && forecastPeriod === '3M' && forecast.next3Months.breakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{item.monthLabel}</td>
                        <td className="px-4 py-2 text-right">{formatINR(item.revenue)}</td>
                      </tr>
                    ))}
                    {forecast && forecastPeriod === '6M' && forecast.next6Months.breakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{item.monthLabel}</td>
                        <td className="px-4 py-2 text-right">{formatINR(item.revenue)}</td>
                      </tr>
                    ))}
                    {forecast && forecastPeriod === '12M' && forecast.next12Months.breakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{item.monthLabel}</td>
                        <td className="px-4 py-2 text-right">{formatINR(item.revenue)}</td>
                      </tr>
                    ))}
                    {forecastPeriod === 'Custom' && customForecastData && customForecastData.breakdown.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{item.monthLabel}</td>
                        <td className="px-4 py-2 text-right">{formatINR(item.revenue)}</td>
                      </tr>
                    ))}
                    {forecastPeriod === 'Custom' && !customForecastData && (
                      <tr>
                        <td colSpan="2" className="px-4 py-4 text-center text-slate-400">Select dates and run model</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Forecast Projections Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-indigo-500 w-5 h-5" />
              <h3 className="text-md font-bold text-slate-950 font-display">Revenue Forecast Chart</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-blue-500 inline-block" />
                <span className="text-slate-500 font-semibold">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" />
                <span className="text-slate-500 font-semibold">Forecast</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => '₹' + (value / 1000).toFixed(0) + 'K'} />
                {firstForecastMonth && (
                  <ReferenceLine
                    x={firstForecastMonth}
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Forecast starts here →',
                      fill: '#059669',
                      fontSize: 10,
                      position: 'insideTopLeft',
                      fontWeight: 'bold'
                    }}
                  />
                )}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-150 p-3 rounded-lg shadow-md font-sans">
                        <p className="text-xs font-bold text-slate-500">{data.name}</p>
                        {data.actual !== null && (
                          <p className="text-xs font-bold text-slate-800 mt-1">
                            Actual: <span className="text-blue-500 font-extrabold">{formatINR(data.actual)}</span>
                          </p>
                        )}
                        {data.projected !== null && (
                          <p className="text-xs font-bold text-slate-800 mt-0.5">
                            Forecasted: <span className="text-emerald-500 font-extrabold">{formatINR(data.projected)}</span>
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#10B981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section 3: Revenue Source Pie & Comparison Bar ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Source Distribution Pie/Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <PieIcon className="text-indigo-500 w-5 h-5" />
            <h3 className="text-md font-bold text-slate-950 font-display">Revenue Distribution</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-[200px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                    stroke="none"
                  >
                    {sources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-150 p-2.5 rounded-lg shadow-md font-sans text-xs">
                          <p className="font-bold text-slate-600">{data.name}</p>
                          <p className="font-extrabold text-slate-900 mt-1">{formatINR(data.amount)} ({data.percentage}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-3 font-sans">
              {sources.map((src, index) => (
                <div key={index} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: src.color }} />
                    <span className="font-semibold text-slate-600">{src.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">{formatINR(src.amount)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{src.percentage}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Revenue History Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <BarChart3 className="text-indigo-500 w-5 h-5" />
            <h3 className="text-md font-bold text-slate-950 font-display">Historical Revenue Comparison</h3>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.slice(-12)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={(value) => '₹' + (value / 1000).toFixed(0) + 'K'} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-150 p-2.5 rounded-lg shadow-md font-sans text-xs">
                        <p className="font-bold text-slate-600">{data.monthLabel}</p>
                        <p className="font-extrabold text-indigo-600 mt-1">Revenue: {formatINR(data.revenue)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">MoM growth: {data.growthPct >= 0 ? `+${data.growthPct}` : data.growthPct}%</p>
                      </div>
                    );
                  }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section 4: Top Clients & Business Insights ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <ListOrdered className="text-indigo-500 w-5 h-5" />
            <h3 className="text-md font-bold text-slate-950 font-display">Top Paying Clients</h3>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-50 flex-grow">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3 text-right">Invoices</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {topClients.map((client, index) => (
                  <tr key={client.id || index} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{client.clientName}</td>
                    <td className="px-4 py-3 text-slate-500">{client.company}</td>
                    <td className="px-4 py-3 text-right">{client.invoices} paid</td>
                    <td className="px-4 py-3 text-right text-indigo-600 font-extrabold">{formatINR(client.revenue)}</td>
                  </tr>
                ))}
                {topClients.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-slate-400">No client data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Business Insights Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
              <Zap className="text-indigo-500 w-5 h-5" />
              <h3 className="text-md font-bold text-slate-950 font-display">Revenue Insights</h3>
            </div>

            <ul className="space-y-3 font-sans text-xs">
              {insights.map((insight, index) => (
                <li key={index} className="flex gap-2.5 items-start p-3 bg-slate-50/70 border border-slate-100 rounded-xl leading-relaxed text-slate-700">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 mt-1.5" />
                  <span className="font-medium">{insight}</span>
                </li>
              ))}
              {insights.length === 0 && (
                <li className="text-slate-400 text-center py-6">No forecasting insights calculated</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Section 5: Forecast Data Source ─────────────────── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-800 font-display">Forecast Data Source</h4>
          <p className="text-xs text-slate-500 mt-1">
            Predictive forecasting models are trained on validated invoice issuances and transaction settlement records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-center min-w-[120px] shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoices Analyzed</span>
            <span className="text-base font-extrabold text-indigo-600 mt-1 block">{overview.invoicesCount}</span>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-center min-w-[120px] shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transactions Settled</span>
            <span className="text-base font-extrabold text-indigo-600 mt-1 block">{overview.transactionsCount}</span>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-center min-w-[150px] shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Training Period</span>
            <span className="text-xs font-extrabold text-slate-700 mt-1.5 block">{overview.trainingPeriod}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueForecast;
