import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle, Coins, Loader } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { getDailySummary } from '../services/api';

const PAYMENT_COLORS = ['#2563EB', '#9CA3AF', '#10B981'];

const emptyData = {
  totalRevenue: 0,
  totalOrders: 0,
  averageSpend: 0,
  averageSpendPerPerson: 0,
  totalTips: 0,
  averageTableTimeMinutes: 0,
  netProfit: 0,
  cancellationsAndComps: 0,
  paymentMethodsData: [],
  incomeExpensesData: [],
  splitRateData: [],
  peakHoursData: [],
  topItemsData: []
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState<any>(emptyData);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const summary = await getDailySummary(period);
        if (summary && !summary.message) {
          setData(summary);
        } else {
          // Explicitly set empty data if the API returns a message (like "No data for today")
          setData(emptyData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        setData(emptyData);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Loader size={48} className="animate-spin text-primary mb-4" />
        <p>{t('Generating...')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard Analytics')}</h1>
          <p className="text-sm text-gray-500 mt-1">Performance & financial breakdown.</p>
        </div>

        {/* Segmented Control */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'daily', label: 'Günlük' },
            { id: 'weekly', label: 'Haftalık' },
            { id: 'monthly', label: 'Aylık' },
            { id: 'yearly', label: 'Yıllık' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === opt.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Summary Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">

        {/* Daily Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Ciro')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalRevenue.toLocaleString()} ₺</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Banknote size={24} className="text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-md ${data.totalRevenue > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
              <TrendingUp size={16} className="mr-1" />
              Live
            </span>
            <span className="text-gray-400 ml-2">from backend</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Net Profit')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.netProfit.toLocaleString()} ₺</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <Coins size={24} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-md ${data.netProfit > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
              <TrendingUp size={16} className="mr-1" />
              Live
            </span>
            <span className="text-gray-400 ml-2">from backend</span>
          </div>
        </div>

        {/* Avg Spend Per Person */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Kişi Başı Harcama')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.averageSpendPerPerson.toLocaleString()} ₺</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Wallet size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-md ${data.averageSpend > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
              <TrendingUp size={16} className="mr-1" />
              Live
            </span>
            <span className="text-gray-400 ml-2">from backend</span>
          </div>
        </div>

        {/* Total Tips */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Toplam Bahşiş')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.totalTips.toLocaleString()} ₺</h3>
            </div>
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center">
              <Coins size={24} className="text-teal-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-md ${data.totalOrders > 0 ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
              <TrendingUp size={16} className="mr-1" />
              Live
            </span>
            <span className="text-gray-400 ml-2">from backend</span>
          </div>
        </div>

        {/* Avg Table Time */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('Ortalama Masa Süresi')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.averageTableTimeMinutes} <span className="text-xl text-gray-500">dk</span></h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Clock size={24} className="text-orange-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
              Stable
            </span>
            <span className="text-gray-400 ml-2">optimal turnover</span>
          </div>
        </div>

        {/* Cancellations & Comps */}
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-500">{t('Cancellations & Comps')}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.cancellationsAndComps.toLocaleString()} ₺</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-md ${data.cancellationsAndComps > 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'}`}>
              <TrendingDown size={16} className="mr-1" />
              Live
            </span>
            <span className="text-gray-400 ml-2">revenue leakage</span>
          </div>
        </div>

      </div>

      {/* Main Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">

        {/* Peak Hours Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('En Yoğun Saatler')}</h3>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1C1C1E', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="orders" name={t('Orders')} stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('Income vs Expenses')}</h3>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.incomeExpensesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F2F2F7' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `₺${value.toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Revenue" name={t('Revenue')} fill="#10B981" radius={[6, 6, 0, 0]} barSize={60} />
                <Bar dataKey="Expenses" name={t('Expenses')} fill="#EF4444" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Secondary Charts Section (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[350px]">

        {/* Payment Methods (Donut) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2 w-full">{t('Payment Methods')}</h3>
          <div className="flex-1 w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.paymentMethodsData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₺${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Split Rate (Radial Bar) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center relative">
          <h3 className="text-lg font-bold text-gray-900 mb-2 w-full">{t('Split Rate')}</h3>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
            <span className="text-3xl font-black text-primary">
              {data.splitRateData.find((d: any) => d.name === 'Split Bill')?.value || 0}%
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Split Bill')}</span>
          </div>
          <div className="flex-1 w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="60%" outerRadius="90%"
                barSize={16}
                data={data.splitRateData}
                startAngle={90} endAngle={-270}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm text-gray-600">{t('Split Bill')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200"></div>
              <span className="text-sm text-gray-600">{t('Single Payment')}</span>
            </div>
          </div>
        </div>

        {/* Top Selling Items (Bar) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('En Çok Satan Ürünler')}</h3>
          <div className="flex-1 w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topItemsData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5EA" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#3A3A3C', fontSize: 13, fontWeight: 500 }} width={100} />
                <Tooltip
                  cursor={{ fill: '#F2F2F7' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `₺${value.toLocaleString()}` : value,
                    name === 'revenue' ? t('Revenue') : t('Sales')
                  ]}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={20} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
