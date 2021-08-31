import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const extistProduct = updatedCart.find(product => product.id === productId);
      const getStokProduct = await api.get(`/stock/${productId}`).then(response => response.data.amount);
      const amountCurrent = extistProduct ? extistProduct.amount : 0;
      const amount = amountCurrent + 1;

      if( amount > getStokProduct ){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(extistProduct) {
        extistProduct.amount = amount;
      } else {
        const product = api.get(`/products/${productId}`);

        const newProduct = {
          ...(await product).data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }
      
      setCart(updatedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const updatedCart = [...cart];
      const cartProductToupdate = updatedCart.findIndex(cart => cart.id === productId);

      if(cartProductToupdate >= 0 ){
        updatedCart.slice(cartProductToupdate, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0 ){        
        return;
      }

      const newCart = [...cart];

      const extistProduct = newCart.find(product => product.id === productId);

      const getStokProduct = await api.get(`/stock/${productId}`).then(response => response.data.amount);

      if( amount > getStokProduct ){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(extistProduct) {
        extistProduct.amount = amount;
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        throw Error();
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
