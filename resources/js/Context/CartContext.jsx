import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children, initialCartCount = 0 }) {
    const [cartCount, setCartCount] = useState(initialCartCount);

    return (
        <CartContext.Provider value={{ cartCount, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
