import { useEffect, useState } from 'react';
import { getTables, getTableQrUrl, deleteTable, getTableSession, addPosItem } from '../services/api';
import { Plus, Download, QrCode as QrCodeIcon, X, Trash2, Edit3 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TableQrDocument from '../components/TableQrDocument';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface RestaurantTable {
  id: string;
  tableNumber: string;
  sessionId: string;
  isOccupied: boolean;
}

const Tables = () => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNameInput, setTableNameInput] = useState('');

  // POS State
  const [selectedTableForPos, setSelectedTableForPos] = useState<RestaurantTable | null>(null);
  const [posItems, setPosItems] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
  const [posNameInput, setPosNameInput] = useState('');
  const [posPriceInput, setPosPriceInput] = useState('');
  const [posQtyInput, setPosQtyInput] = useState('1');
  const [posLoading, setPosLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      if (data.success && data.tables) {
        setTables(data.tables);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!tableNameInput.trim()) return;
    
    const newTable: RestaurantTable = {
      id: Math.random().toString(36).substring(2, 9),
      tableNumber: tableNameInput,
      sessionId: Math.random().toString(36).substring(2, 9),
      isOccupied: false
    };
    
    setTables([...tables, newTable]);
    setIsModalOpen(false);
    setTableNameInput('');
  };

  const handleDeleteTable = async (id: string) => {
    try {
      const data = await deleteTable(id);
      if (data.success) {
        setTables(tables.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  // 1. ADIM: QR Kodların içine Vercel PWA adresini gömüyoruz
  const generateDeepLinkUrl = (sessionId: string) => 
    `https://masa-phi-lemon.vercel.app/table/${sessionId}`;

  const openPosSimulator = async (table: RestaurantTable) => {
    setSelectedTableForPos(table);
    setPosItems([]);
    setPosLoading(true);
    try {
      const session = await getTableSession(table.sessionId);
      if (session && session.billItems) {
        const groupedItems = session.billItems.reduce((acc: any[], item: any) => {
          const existing = acc.find(i => i.name === item.name && i.price === item.price);
          if (existing) {
            existing.qty += 1;
          } else {
            acc.push({ id: item.id.toString(), name: item.name, price: item.price, qty: 1 });
          }
          return acc;
        }, []);
        setPosItems(groupedItems);
      }
    } catch (e) {
      console.log('No session exists yet or error fetching session', e);
    } finally {
      setPosLoading(false);
    }
  };

  const handleAddPosItem = async () => {
    if (!posNameInput || !posPriceInput || !selectedTableForPos) return;
    
    setPosLoading(true);
    try {
      const qty = parseInt(posQtyInput, 10) || 1;
      const price = parseFloat(posPriceInput);
      
      const data = await addPosItem(selectedTableForPos.sessionId, {
        name: posNameInput,
        price: price,
        quantity: qty
      });

      if (data.success) {
        const existing = posItems.find(i => i.name === posNameInput && i.price === price);
        if (existing) {
          setPosItems(posItems.map(i => i === existing ? { ...i, qty: i.qty + qty } : i));
        } else {
          setPosItems([...posItems, { id: Math.random().toString(36).substring(7), name: posNameInput, price, qty }]);
        }

        setTables(tables.map(t => t.id === selectedTableForPos.id ? { ...t, isOccupied: true } : t));
        
        setPosNameInput('');
        setPosPriceInput('');
        setPosQtyInput('1');
      }
    } catch (error) {
      console.error('Failed to add item', error);
    } finally {
      setPosLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Active Tables')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('Manage restaurant tables and generate QR codes.')}</p>
        </div>
        <button 
          onClick={handleAddTable}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          {t('Add New Table')}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <QrCodeIcon size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('No tables found')}</h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">{t("You haven't added any tables yet. Create your first table to start generating QR codes.")}</p>
          <button 
            onClick={handleAddTable}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            {t('Add your first table')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div key={table.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div 
                  className="cursor-pointer group/title" 
                  onClick={() => openPosSimulator(table)}
                >
                  <h3 className="text-lg font-bold text-gray-900 group-hover/title:text-primary transition-colors flex items-center gap-2">
                    {table.tableNumber}
                    <Edit3 size={16} className="text-gray-300 group-hover/title:text-primary transition-colors" />
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${table.isOccupied ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {table.isOccupied ? t('Occupied') : t('Available')}
                  </span>
                  <p className="text-xs text-primary mt-2 font-medium opacity-0 group-hover/title:opacity-100 transition-opacity">
                    Manage Order &rarr;
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                    <QrCodeIcon size={20} className="text-gray-500" />
                  </div>
                  <button 
                    onClick={() => handleDeleteTable(table.id)}
                    className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <button 
                  onClick={() => setSelectedTableForQr(table)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <QrCodeIcon size={16} />
                  {t('Preview QR Code')}
                </button>
                
                {/* 2. ADIM: PDF indirirken de Vercel linkini gönderiyoruz */}
                <PDFDownloadLink 
                  document={<TableQrDocument tableId={table.tableNumber} qrUrl={generateDeepLinkUrl(table.sessionId)} />} 
                  fileName={`${table.tableNumber.replace(' ', '_')}_QR.pdf`}
                  className="w-full"
                >
                  {({ loading: pdfLoading }) => (
                    <button 
                      disabled={pdfLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-70"
                    >
                      <Download size={16} />
                      {pdfLoading ? t('Generating PDF...') : t('Download PDF')}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POS Simulator Modal */}
      {selectedTableForPos && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex-1 p-8 border-r border-gray-100 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTableForPos.tableNumber} - {t('POS Simulator')}</h2>
                  <p className="text-gray-500 text-sm mt-1">Manual order entry for testing the table session.</p>
                </div>
                <button onClick={() => setSelectedTableForPos(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Item Name')}</label>
                  <input 
                    type="text" 
                    value={posNameInput}
                    onChange={(e) => setPosNameInput(e.target.value)}
                    placeholder="e.g. Iced Latte"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPosItem() }}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Price')} (₺)</label>
                    <input 
                      type="number" 
                      value={posPriceInput}
                      onChange={(e) => setPosPriceInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddPosItem() }}
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Quantity')}</label>
                    <input 
                      type="number" 
                      value={posQtyInput}
                      onChange={(e) => setPosQtyInput(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddPosItem() }}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddPosItem}
                  disabled={posLoading}
                  className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {posLoading ? t('Adding...') : t('Add to Order')}
                </button>
              </div>
            </div>

            <div className="w-full md:w-[400px] bg-gray-50 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{t('Order Summary')}</h3>
                <button onClick={() => { setSelectedTableForPos(null); setPosItems([]); }} className="hidden md:block p-2 hover:bg-gray-200 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="text-center mb-6 pb-6 border-b border-dashed border-gray-200">
                  <h4 className="font-bold text-gray-900 uppercase tracking-widest text-sm">Receipt</h4>
                  <p className="text-xs text-gray-500 mt-1">{selectedTableForPos.tableNumber}</p>
                </div>

                {posLoading && posItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p>Loading...</p>
                  </div>
                ) : posItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>No items added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{item.qty}x</span>
                          <span className="text-gray-900 font-medium">{item.name}</span>
                        </div>
                        <span className="text-gray-900 font-medium">₺{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">{t('Subtotal')}</span>
                  <span className="text-gray-900 font-medium">₺{posItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold mt-2">
                  <span className="text-gray-900">{t('Total')}</span>
                  <span className="text-primary">₺{posItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {selectedTableForQr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{selectedTableForQr.tableNumber}</h3>
              <button onClick={() => setSelectedTableForQr(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 mb-6">
              <QRCodeSVG 
                value={generateDeepLinkUrl(selectedTableForQr.sessionId)} 
                size={200}
                level="Q"
                includeMargin={true}
              />
            </div>
            
            <p className="text-center text-sm text-gray-500 mb-6 px-4">
              {t('Customers can scan this code using their native phone camera to instantly join the table.')}
            </p>
            
            <PDFDownloadLink 
              document={<TableQrDocument tableId={selectedTableForQr.tableNumber} qrUrl={generateDeepLinkUrl(selectedTableForQr.sessionId)} />} 
              fileName={`${selectedTableForQr.tableNumber.replace(' ', '_')}_QR.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button 
                  disabled={pdfLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  <Download size={18} />
                  {pdfLoading ? t('Generating...') : t('Download High-Res PDF')}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t('Add New Table')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('Table Name')}</label>
              <input 
                type="text" 
                value={tableNameInput}
                onChange={(e) => setTableNameInput(e.target.value)}
                placeholder="Masa 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('Cancel')}
              </button>
              <button 
                onClick={handleModalSubmit}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                {t('Submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;