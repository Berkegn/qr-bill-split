import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5079/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTables = async () => {
  const response = await api.get('/b2b/tables');
  return response.data;
};

export const createTable = async (tableName?: string) => {
  const response = await api.post('/b2b/tables', { tableNumber: tableName });
  return response.data;
};

export const deleteTable = async (id: string) => {
  const response = await api.delete(`/b2b/tables/${id}`);
  return response.data;
};

export const getTableQrUrl = (tableId: string) => {
  return `http://localhost:5079/api/tables/${tableId}/qr`;
};

export const getTableSession = async (sessionId: string) => {
  const response = await api.get(`/tables/${sessionId}`);
  return response.data;
};

export const addPosItem = async (sessionId: string, itemData: { name: string, price: number, quantity: number }) => {
  const response = await api.post(`/b2b/tables/${sessionId}/items`, itemData);
  return response.data;
};

export const getOrders = async (tableId: string) => {
  const response = await api.get(`/tables/${tableId}/orders`);
  return response.data;
};

export const getDailySummary = async (period: string = 'daily') => {
  const response = await api.get(`/analytics/daily-summary?period=${period}`);
  return response.data;
};

// --- Products API ---

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const addProduct = async (productData: { name: string, category: string, price: number }) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id: string, productData: { name: string, category: string, price: number }) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export default api;
