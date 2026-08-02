import { apiAgent } from '../agent/apiAgent';
import { Product } from '../../domain/models/Product';

export const MenuRepository = {
  getMenuItems: async (): Promise<Product[]> => {
    return await apiAgent.get<Product[]>('/products');
  }
};
