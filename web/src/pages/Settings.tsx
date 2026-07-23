import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Store, Utensils, Users, Upload, Plus, Edit2, Trash2, ShieldCheck, X } from 'lucide-react';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  // Local state for Menu Management
  const [products, setProducts] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Beverages');
  const [productPrice, setProductPrice] = useState('');

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'menu') {
      fetchProducts();
    }
  }, [activeTab]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('Beverages');
    setProductPrice('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductPrice(product.price.toString());
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) return;
    const price = parseFloat(productPrice);
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, { name: productName, category: productCategory, price });
      } else {
        await addProduct({ name: productName, category: productCategory, price });
      }
      await fetchProducts();
    } catch (e) {
      console.error('Failed to save product', e);
      alert('Failed to save product. Is the backend running?');
    }
    
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (e) {
      console.error('Failed to delete product', e);
    }
  };

  const tabs = [
    { id: 'general', label: 'Genel Ayarlar', icon: <Store size={18} /> },
    { id: 'menu', label: 'Menü Yönetimi', icon: <Utensils size={18} /> },
    { id: 'staff', label: 'Personel', icon: <Users size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Store size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('Restaurant Profile')}</h3>
                <p className="text-sm text-gray-500">Manage your business details and preferences.</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Saved!"); }}>
              {/* Logo Upload Placeholder */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                  <Upload size={24} className="text-primary" />
                </div>
                <p className="font-medium text-gray-900">Upload Restaurant Logo</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Restaurant Name')}</label>
                <input 
                  type="text" 
                  defaultValue="Split.It Restaurant"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Currency Preference')}</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white appearance-none">
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Tax Rate (%)')}</label>
                  <input 
                    type="number" 
                    defaultValue="8"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-8">
                <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  {t('Save Changes')}
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'menu':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Menü Yönetimi</h3>
                <p className="text-sm text-gray-500">Manage products, categories, and pricing.</p>
              </div>
              <button 
                onClick={openAddProductModal}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Item Name</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${product.category === 'Desserts' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">₺{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button 
                          onClick={() => openEditProductModal(product)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No products found. Click "Add Product" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                    <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input 
                        type="text" 
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Iced Latte"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select 
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                      >
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Starters">Starters</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)</label>
                      <input 
                        type="number" 
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        placeholder="120.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsProductModalOpen(false)}
                      className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProduct}
                      className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'staff':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personel Yönetimi</h3>
                <p className="text-sm text-gray-500">Manage access and roles for your team.</p>
              </div>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm">
                <Plus size={18} />
                Invite Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                  AD
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">Admin User</h4>
                  <p className="text-sm text-gray-500 mb-2">admin@qrbillsplit.local</p>
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                    <ShieldCheck size={14} /> Manager
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-bold text-lg">
                  AY
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">Ahmet Yılmaz</h4>
                  <p className="text-sm text-gray-500 mb-2">ahmet@qrbillsplit.local</p>
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-bold">
                    Waitstaff
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('Settings')}</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
