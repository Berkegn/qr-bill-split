import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Clock, ShoppingBag, Award, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import api from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  totalRevenue?: number;
  avgSessionMinutes?: number;
  averageTableTimeMinutes?: number; // legacy field name
  totalOrders?: number;
  topProduct?: string;
  // new field names
  revenueByDay?: { date: string; revenue: number }[];
  revenueByTable?: { tableName: string; revenue: number; orders: number; avgMinutes: number }[];
  topProducts?: { name: string; count: number; revenue: number }[];
  paymentMethods?: { method: string; count: number }[];
  // legacy field names (old backend)
  incomeExpensesData?: { name: string; Revenue: number }[];
  topItemsData?: { name: string; sales: number; revenue: number }[];
  paymentMethodsData?: { name: string; value: number }[];
}

interface CompletedSession {
  tableNumber: string;
  totalPaid: number;
  checkoutTime: string;
  itemCount: number;
  durationMinutes: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

const COLORS = ['#0A84FF', '#34C759', '#FF9F0A', '#FF3B30', '#BF5AF2', '#5AC8FA'];

const PERIOD_OPTIONS = [
  { label: 'Son 7 Gün', days: 7 },
  { label: 'Son 30 Gün', days: 30 },
  { label: 'Tüm Zamanlar', days: 365 },
];

// Normalise data from either old or new backend response shape
function normalise(raw: AnalyticsData) {
  const revenueByDay: { date: string; revenue: number }[] =
    raw.revenueByDay ??
    (raw.incomeExpensesData ?? []).map((d) => ({ date: d.name, revenue: d.Revenue ?? 0 }));

  const topProducts: { name: string; count: number; revenue: number }[] =
    raw.topProducts ??
    (raw.topItemsData ?? []).map((d) => ({ name: d.name, count: d.sales ?? 0, revenue: d.revenue ?? 0 }));

  const paymentMethods: { method: string; count: number }[] =
    raw.paymentMethods ??
    (raw.paymentMethodsData ?? []).map((d) => ({ method: d.name, count: Math.round(d.value ?? 0) }));

  const revenueByTable: { tableName: string; revenue: number; orders: number; avgMinutes: number }[] =
    raw.revenueByTable ?? [];

  const avgSession =
    raw.avgSessionMinutes ?? raw.averageTableTimeMinutes ?? 0;

  return {
    totalRevenue: raw.totalRevenue ?? 0,
    avgSessionMinutes: avgSession,
    totalOrders: raw.totalOrders ?? 0,
    topProduct: raw.topProduct ?? (topProducts[0]?.name ?? '—'),
    revenueByDay,
    revenueByTable,
    topProducts,
    paymentMethods,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [raw, setRaw] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodIdx, setPeriodIdx] = useState(1);

  const load = async (days: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.allSettled([
        api.get(`/analytics/daily-summary?days=${days}`),
        api.get('/analytics/history'),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setRaw(summaryRes.value.data);
      } else {
        setError('Özet verisi yüklenemedi.');
      }

      if (historyRes.status === 'fulfilled') {
        setSessions(historyRes.value.data?.sessions ?? []);
      }
      // history endpoint is optional — no error if missing
    } catch {
      setError('Veriler yüklenemedi. Backend çalışıyor mu?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(PERIOD_OPTIONS[periodIdx].days);
  }, [periodIdx]);

  const data = raw ? normalise(raw) : null;

  const kpis = data
    ? [
        { label: 'Toplam Ciro', value: fmt(data.totalRevenue), icon: <TrendingUp size={22} />, color: '#0A84FF', bg: '#EEF4FF' },
        { label: 'Ort. Oturum Süresi', value: `${Math.round(data.avgSessionMinutes)} dk`, icon: <Clock size={22} />, color: '#34C759', bg: '#EDFFF3' },
        { label: 'Toplam İşlem', value: data.totalOrders.toLocaleString('tr-TR'), icon: <ShoppingBag size={22} />, color: '#FF9F0A', bg: '#FFF8EC' },
        { label: 'En Çok Satan', value: data.topProduct || '—', icon: <Award size={22} />, color: '#BF5AF2', bg: '#F5EEFF' },
      ]
    : [];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masa Özetleri & Analiz</h1>
          <p className="text-sm text-gray-500 mt-1">Restoran performansınızı gerçek verilerle izleyin.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={periodIdx}
              onChange={(e) => setPeriodIdx(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              {PERIOD_OPTIONS.map((o, i) => (
                <option key={i} value={i}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => load(PERIOD_OPTIONS[periodIdx].days)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-500">Veriler yükleniyor...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
          <AlertCircle size={48} className="opacity-30" />
          <p className="text-lg font-medium">Veri yüklenemedi</p>
          <p className="text-sm">Backend çalışıyor mu? <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">dotnet run</code></p>
          <button
            onClick={() => load(PERIOD_OPTIONS[periodIdx].days)}
            className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                  {kpi.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium truncate">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Line + Payment Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Günlük Ciro</h2>
              {data.revenueByDay.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Bu dönem için veri yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [fmt(v), 'Ciro']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E5EA', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#0A84FF" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#0A84FF' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Ödeme Yöntemleri</h2>
              {data.paymentMethods.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.paymentMethods} dataKey="count" nameKey="method" cx="50%" cy="45%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                      {data.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} iconType="circle" iconSize={8} />
                    <Tooltip formatter={(v: number) => [v, 'İşlem']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E5EA' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products Bar + Table Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">En Çok Satan Ürünler</h2>
              {data.topProducts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Veri yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topProducts.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8E8E93' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#3C3C43' }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip formatter={(v: number) => [v, 'Adet']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E5EA' }} />
                    <Bar dataKey="count" fill="#0A84FF" radius={[0, 6, 6, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Masa Bazlı Özet</h2>
              {data.revenueByTable.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">Tamamlanan oturum bulunamadı</div>
              ) : (
                <div className="overflow-auto max-h-56">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <th className="pb-2 text-left font-semibold">Masa</th>
                        <th className="pb-2 text-right font-semibold">Ciro</th>
                        <th className="pb-2 text-right font-semibold">Sipariş</th>
                        <th className="pb-2 text-right font-semibold">Ort. Süre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.revenueByTable.map((row) => (
                        <tr key={row.tableName} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 font-medium text-gray-900">{row.tableName}</td>
                          <td className="py-2.5 text-right text-green-600 font-semibold">{fmt(row.revenue)}</td>
                          <td className="py-2.5 text-right text-gray-600">{row.orders}</td>
                          <td className="py-2.5 text-right text-gray-500">{Math.round(row.avgMinutes)} dk</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Completed Sessions (from /analytics/history) */}
          {sessions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Son Tamamlanan Oturumlar</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                      <th className="pb-2 text-left font-semibold">Masa</th>
                      <th className="pb-2 text-right font-semibold">Ödenen</th>
                      <th className="pb-2 text-right font-semibold">Ürün Sayısı</th>
                      <th className="pb-2 text-right font-semibold">Süre</th>
                      <th className="pb-2 text-right font-semibold">Saat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessions.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 font-medium text-gray-900">{s.tableNumber}</td>
                        <td className="py-2.5 text-right text-green-600 font-semibold">{fmt(s.totalPaid)}</td>
                        <td className="py-2.5 text-right text-gray-600">{s.itemCount}</td>
                        <td className="py-2.5 text-right text-gray-500">{Math.round(s.durationMinutes)} dk</td>
                        <td className="py-2.5 text-right text-gray-400 text-xs">
                          {new Date(s.checkoutTime).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
