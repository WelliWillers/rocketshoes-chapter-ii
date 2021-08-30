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
    const storagedCart = window.localStorage.getItem("@rocktshoes/cart");

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
        toast.error('Não a mais deste produtos em estoque!');
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

      window.localStorage.setItem("@rocktshoes/cart", JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro ao adicionar produto ao carrinho!');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const RemoveItemOfCart = cart.filter(cart => cart.id !== productId);
      setCart(RemoveItemOfCart);
      
      window.localStorage.setItem("@rocktshoes/cart", JSON.stringify(RemoveItemOfCart));
    } catch {
      toast.error('Erro ao remover este produto do carrinho!');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];

      const extistProduct = updatedCart.find(product => product.id === productId);

      const getStokProduct = await api.get(`/stock/${productId}`).then(response => response.data.amount);

      if( amount > getStokProduct ){
        toast.error('Não a mais deste produtos em estoque!');
        return;
      }

      if(extistProduct) {
        extistProduct.amount = amount;
      } else {
        return;
      }
      
      setCart(updatedCart);
      
      window.localStorage.setItem("@rocktshoes/cart", JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro ao atualizar quantidade deste produto!');
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
