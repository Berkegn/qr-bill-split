import { useState, useEffect, useRef } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, uploadParseMenu, getEmployees, createEmployee, deleteEmployee, upsertShift } from '../services/api';
import { Store, Utensils, Users, Upload, Plus, Edit2, Trash2, X, Calendar, Check, Sparkles } from 'lucide-react';

// ── Role config ────────────────────────────────────────────────
const ROLES = [
  { id: 0, label: 'Barista',            color: 'bg-amber-100 text-amber-700',  icon: '☕' },
  { id: 1, label: 'Mutfak Personeli',   color: 'bg-orange-100 text-orange-700', icon: '🍳' },
  { id: 2, label: 'Şef',               color: 'bg-red-100 text-red-700',       icon: '👨‍🍳' },
  { id: 3, label: 'Garson',             color: 'bg-blue-100 text-blue-700',     icon: '🍽️' },
  { id: 4, label: 'Temizlik Görevlisi', color: 'bg-green-100 text-green-700',   icon: '🧹' },
];

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const SHIFTS_PRESETS = ['08:00–16:00', '09:00–17:00', '12:00–20:00', '16:00–00:00'];

const roleFor = (roleId: number) => ROLES.find(r => r.id === roleId) ?? ROLES[3];

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500',
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  // ── Menu state ──────────────────────────────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Kahveler');
  const [productPrice, setProductPrice] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Personnel state ─────────────────────────────────────────
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState(3);
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [shiftModal, setShiftModal] = useState(false);

  // Fetch functions
  const fetchProducts = async () => {
    try { setProducts(await getProducts()); } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.employees ?? []);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'menu') fetchProducts();
    if (activeTab === 'staff') fetchEmployees();
  }, [activeTab]);

  // ── Menu handlers ───────────────────────────────────────────
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('Kahveler');
    setProductPrice('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: any) => {
    setEditingProduct(p);
    setProductName(p.name);
    setProductCategory(p.category);
    setProductPrice(p.price.toString());
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) return;
    const price = parseFloat(productPrice);
    try {
      if (editingProduct) await updateProduct(editingProduct.id, { name: productName, category: productCategory, price });
      else await addProduct({ name: productName, category: productCategory, price });
      await fetchProducts();
    } catch { alert('Ürün kaydedilemedi. Backend çalışıyor mu?'); }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    try { await deleteProduct(id); await fetchProducts(); } catch {}
  };

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadParseMenu(file);
      alert(`✅ ${res.message}`);
      await fetchProducts();
    } catch {
      alert('Menü yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Employee handlers ────────────────────────────────────────
  const handleAddEmployee = async () => {
    if (!empName.trim()) return;
    setSavingEmployee(true);
    try {
      const result = await createEmployee({ fullName: empName, roleId: empRole, email: empEmail, phone: empPhone });
      if (result?.success === false) {
        throw new Error(result.message ?? 'Bilinmeyen hata');
      }
      await fetchEmployees();
      setShowAddEmployee(false);
      setEmpName(''); setEmpEmail(''); setEmpPhone(''); setEmpRole(3);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Sunucuya ulaşılamadı.';
      alert(`Personel eklenemedi: ${msg}`);
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
    try { await deleteEmployee(id); await fetchEmployees(); } catch {}
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleShiftSave = async (employeeId: string, dayIndex: number, value: string) => {
    if (!value) {
      await upsertShift(employeeId, { dayIndex, startTime: '', endTime: '' });
      return;
    }
    const [start, end] = value.split('–');
    await upsertShift(employeeId, { dayIndex, startTime: start?.trim(), endTime: end?.trim() });
    await fetchEmployees();
  };

  const getShiftForDay = (employee: any, dayIndex: number) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Our DAYS = Pzt(Mon=1), Sal(Tue=2), Çar(Wed=3), Per(Thu=4), Cum(Fri=5), Cmt(Sat=6), Paz(Sun=0)
    const dayMap = [1, 2, 3, 4, 5, 6, 0]; // index in DAYS → DayOfWeek index
    const dotNetDay = dayNames[dayMap[dayIndex]];
    const shift = employee.shifts?.find((s: any) => s.dayOfWeek === dotNetDay);
    if (!shift) return '';
    return `${shift.startTime}–${shift.endTime}`;
  };

  const tabs = [
    { id: 'general', label: 'Genel Ayarlar', icon: <Store size={18} /> },
    { id: 'menu', label: 'Menü Yönetimi', icon: <Utensils size={18} /> },
    { id: 'staff', label: 'Personel', icon: <Users size={18} /> },
  ];

  const categoryColors: Record<string, string> = {
    'Kahveler': 'bg-amber-50 text-amber-700',
    'Çaylar': 'bg-green-50 text-green-700',
    'Tatlılar': 'bg-pink-50 text-pink-700',
    'Atıştırmalıklar': 'bg-orange-50 text-orange-700',
    default: 'bg-blue-50 text-blue-700',
  };

  const renderContent = () => {
    switch (activeTab) {

      // ── General ──────────────────────────────────────────────
      case 'general':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Store size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Restoran Profili</h3>
                <p className="text-sm text-gray-500">İşletme bilgilerinizi ve tercihlerinizi yönetin.</p>
              </div>
            </div>
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); alert('Kaydedildi!'); }}>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                  <Upload size={24} className="text-primary" />
                </div>
                <p className="font-medium text-gray-900">Restoran Logosu Yükle</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, en fazla 5MB</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restoran Adı</label>
                <input type="text" defaultValue="Split.It Restaurant" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white appearance-none">
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Oranı (%)</label>
                  <input type="number" defaultValue="8" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        );

      // ── Menu ────────────────────────────────────────────────
      case 'menu':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Menü Yönetimi</h3>
                <p className="text-sm text-gray-500">Ürünleri, kategorileri ve fiyatları yönetin.</p>
              </div>
              <div className="flex gap-2">
                {/* Menu Upload */}
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleMenuUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                >
                  {isUploading
                    ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> Yükleniyor...</>
                    : <><Sparkles size={16} className="text-violet-500" /> Menü Yükle (PDF/Görsel)</>}
                </button>
                <button onClick={openAddProductModal} className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm">
                  <Plus size={16} /> Ürün Ekle
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Ürün Adı</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Fiyat</th>
                    <th className="px-6 py-4 font-medium">Seçenekler</th>
                    <th className="px-6 py-4 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${categoryColors[p.category] ?? categoryColors.default}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">₺{p.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {p.options?.length > 0
                          ? <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full font-medium">{p.options.length} seçenek</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button onClick={() => openEditProductModal(p)} className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">Henüz ürün eklenmemiş. "Ürün Ekle" veya "Menü Yükle" butonunu kullanın.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                    <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"><X size={20} /></button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                      <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="ör. Latte" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" autoFocus />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white">
                        {['Kahveler', 'Çaylar', 'Tatlılar', 'Atıştırmalıklar', 'Sıcak İçecekler', 'Soğuk İçecekler', 'Yiyecekler'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
                      <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="120.00" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">İptal</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">Kaydet</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ── Staff ───────────────────────────────────────────────
      case 'staff':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personel Yönetimi</h3>
                <p className="text-sm text-gray-500">Ekibinizi ve vardiya takvimini yönetin.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedEmployeeId(employees[0]?.id ?? null); setShiftModal(true); }}
                  disabled={employees.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm disabled:opacity-50"
                >
                  <Calendar size={16} /> Vardiya Takvimi
                </button>
                <button onClick={() => setShowAddEmployee(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm">
                  <Plus size={16} /> Personel Ekle
                </button>
              </div>
            </div>

            {/* Employee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp, idx) => {
                const role = roleFor(emp.roleId);
                return (
                  <div key={emp.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                      {initials(emp.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-900 truncate">{emp.fullName}</h4>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{emp.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${role.color}`}>
                          <span>{role.icon}</span>{role.label}
                        </span>
                        {emp.shifts?.length > 0 && (
                          <span className="text-xs text-gray-400">{emp.shifts.length} vardiya</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{emp.phone}</p>
                    </div>
                  </div>
                );
              })}
              {employees.length === 0 && (
                <div className="col-span-2 py-16 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Henüz personel eklenmemiş.</p>
                </div>
              )}
            </div>

            {/* Add Employee Modal */}
            {showAddEmployee && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Yeni Personel Ekle</h3>
                    <button onClick={() => setShowAddEmployee(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                      <input type="text" value={empName} onChange={e => setEmpName(e.target.value)} placeholder="ör. Ayşe Kaya" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" autoFocus />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setEmpRole(r.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${empRole === r.id ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            <span>{r.icon}</span> {r.label}
                            {empRole === r.id && <Check size={14} className="ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                      <input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="ör. ayse@kafe.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <input type="tel" value={empPhone} onChange={e => setEmpPhone(e.target.value)} placeholder="ör. 0532 000 0000" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowAddEmployee(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">İptal</button>
                    <button onClick={handleAddEmployee} disabled={!empName.trim() || savingEmployee} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
                      {savingEmployee ? 'Kaydediliyor...' : 'Personel Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shift Calendar Modal */}
            {shiftModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Haftalık Vardiya Takvimi</h3>
                    <button onClick={() => setShiftModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
                  </div>

                  {/* Employee Selector */}
                  <div className="flex gap-2 flex-wrap mb-6">
                    {employees.map((emp, idx) => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${selectedEmployeeId === emp.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                          {initials(emp.fullName)}
                        </span>
                        {emp.fullName.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {selectedEmployee && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium w-24">Gün</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">Vardiya</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">Hızlı Seç</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {DAYS.map((day, dayIdx) => {
                            const current = getShiftForDay(selectedEmployee, dayIdx);
                            return (
                              <tr key={day} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-3 font-semibold text-gray-700">{day}</td>
                                <td className="px-3 py-3">
                                  <input
                                    type="text"
                                    defaultValue={current}
                                    placeholder="08:00–16:00"
                                    onBlur={e => handleShiftSave(selectedEmployee.id, dayIdx, e.target.value)}
                                    className="w-40 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                  />
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex gap-1 flex-wrap">
                                    {SHIFTS_PRESETS.map(p => (
                                      <button
                                        key={p}
                                        onClick={() => handleShiftSave(selectedEmployee.id, dayIdx, p).then(fetchEmployees)}
                                        className="px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-blue-50 hover:border-primary hover:text-primary transition-colors"
                                      >
                                        {p}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => handleShiftSave(selectedEmployee.id, dayIdx, '').then(fetchEmployees)}
                                      className="px-2 py-1 text-xs rounded-md border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      Kaldır
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <button onClick={() => setShiftModal(false)} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
