import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, saveCart, clearCartStorage } from '../utils/storage';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => getCart());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (foodItem, quantity, specialInstructions = '') => {
    setItems((prev) => {
      const existing = prev.find((i) => i.foodItem._id === foodItem._id);
      if (existing) {
        return prev.map((i) => i.foodItem._id === foodItem._id
          ? { ...i, quantity: i.quantity + quantity, specialInstructions }
          : i);
      }
      return [...prev, { foodItem, quantity, specialInstructions }];
    });
    setIsOpen(true);
  };

  const removeItem = (foodItemId) => {
    setItems((prev) => prev.filter((i) => i.foodItem._id !== foodItemId));
  };

  const updateQuantity = (foodItemId, newQuantity) => {
    if (newQuantity < 1) return removeItem(foodItemId);
    setItems((prev) => prev.map((i) => i.foodItem._id === foodItemId ? { ...i, quantity: newQuantity } : i));
  };

  const updateInstructions = (foodItemId, instructions) => {
    setItems((prev) => prev.map((i) => i.foodItem._id === foodItemId ? { ...i, specialInstructions: instructions } : i));
  };

  const clearCart = () => {
    setItems([]);
    clearCartStorage();
  };

  const toggleCart = () => setIsOpen((prev) => !prev);

  const getTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.foodItem.price * item.quantity), 0);
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    return { subtotal, itemCount };
  };

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, updateQuantity,
      updateInstructions, clearCart, toggleCart, getTotal, setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
