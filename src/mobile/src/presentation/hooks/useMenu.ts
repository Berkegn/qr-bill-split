import { useState, useEffect, useCallback } from 'react';
import { MenuRepository } from '../../data/repositories/MenuRepository';
import { Product } from '../../domain/models/Product';

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MenuRepository.getMenuItems();
      setMenuItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  return {
    menuItems,
    isLoading,
    error,
    refreshMenu: loadMenu
  };
};
