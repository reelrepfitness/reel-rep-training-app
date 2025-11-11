import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, SubscriptionPackage, PaymentMethod } from '@/constants/types';
import { subscriptionPackages } from '@/constants/mockData';
import { useAuth } from './AuthContext';

const CART_STORAGE_KEY = '@reelrep_cart';

export const [ShopProvider, useShop] = createContextHook(() => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [packages] = useState<SubscriptionPackage[]>(subscriptionPackages);
  const [platesToUse, setPlatesToUse] = useState<number>(0);

  const cartQuery = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(`${CART_STORAGE_KEY}_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!user,
  });

  const syncMutation = useMutation({
    mutationFn: async (cart: CartItem[]) => {
      if (user) {
        await AsyncStorage.setItem(`${CART_STORAGE_KEY}_${user.id}`, JSON.stringify(cart));
      }
      return cart;
    },
  });

  const { mutate: syncCart } = syncMutation;

  useEffect(() => {
    if (cartQuery.data !== undefined) {
      setCart(cartQuery.data);
    }
  }, [cartQuery.data]);

  const addToCart = useCallback((pkg: SubscriptionPackage) => {
    const existing = cart.find(item => item.package.id === pkg.id);
    
    if (existing) {
      const updated = cart.map(item =>
        item.package.id === pkg.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updated);
      syncCart(updated);
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        package: pkg,
        quantity: 1,
      };
      const updated = [...cart, newItem];
      setCart(updated);
      syncCart(updated);
    }
  }, [cart, syncCart]);

  const removeFromCart = useCallback((itemId: string) => {
    const updated = cart.filter(item => item.id !== itemId);
    setCart(updated);
    syncCart(updated);
  }, [cart, syncCart]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    const updated = cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(updated);
    syncCart(updated);
  }, [cart, syncCart, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    syncCart([]);
  }, [syncCart]);

  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.package.price * item.quantity, 0);
  }, [cart]);

  const getDiscountedTotal = useCallback(() => {
    const total = getTotal();
    return Math.max(0, total - platesToUse);
  }, [getTotal, platesToUse]);

  const getMaxPlatesUsable = useCallback(() => {
    const total = getTotal();
    const userPlateBalance = user?.plateBalance || 0;
    return Math.min(userPlateBalance, total);
  }, [getTotal, user?.plateBalance]);

  const applyPlates = useCallback((amount: number) => {
    const maxUsable = getMaxPlatesUsable();
    setPlatesToUse(Math.min(Math.max(0, amount), maxUsable));
  }, [getMaxPlatesUsable]);

  const resetPlates = useCallback(() => {
    setPlatesToUse(0);
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: async (paymentData: {
      paymentMethod: PaymentMethod;
      billingAddress?: string;
    }) => {
      console.log('Processing payment...', paymentData);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearCart();
      
      return {
        success: true,
        orderId: `ORD-${Date.now()}`,
        message: 'התשלום בוצע בהצלחה',
      };
    },
  });

  const { mutateAsync: processCheckout } = checkoutMutation;

  const checkout = useCallback(async (paymentData: {
    paymentMethod: PaymentMethod;
    billingAddress?: string;
  }) => {
    return processCheckout(paymentData);
  }, [processCheckout]);

  return useMemo(() => ({
    cart,
    packages,
    isLoading: cartQuery.isLoading,
    isProcessing: checkoutMutation.isPending,
    platesToUse,
    totalPlates: user?.plateBalance || 0,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getDiscountedTotal,
    getMaxPlatesUsable,
    applyPlates,
    resetPlates,
    checkout,
  }), [cart, packages, cartQuery.isLoading, checkoutMutation.isPending, platesToUse, user?.plateBalance, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getDiscountedTotal, getMaxPlatesUsable, applyPlates, resetPlates, checkout]);
});
