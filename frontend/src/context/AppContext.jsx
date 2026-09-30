import React from "react";
import {createContext,useContext,useEffect,useState} from 'react'; import {api} from '../services/api';
const C=createContext(); export const useApp=()=>useContext(C);
export function AppProvider({children}){const [user,setUser]=useState(null),[cart,setCart]=useState([]),[wishlist,setWishlist]=useState([]),[loading,setLoading]=useState(true);
const refresh=async()=>{const t=localStorage.getItem('ft_token');if(!t){setLoading(false);return}try{const [u,c,w]=await Promise.all([api.get('/shop/me'),api.get('/shop/cart'),api.get('/shop/wishlist')]);setUser(u.data);setCart(c.data);setWishlist(w.data)}catch{localStorage.removeItem('ft_token');setUser(null)}finally{setLoading(false)}};
useEffect(()=>{refresh()},[]); const logout=()=>{localStorage.removeItem('ft_token');setUser(null);setCart([]);setWishlist([])};
const addCart=async(productId,variantId)=>{await api.post('/shop/cart',{productId,variantId,quantity:1});const c=await api.get('/shop/cart');setCart(c.data)}; const toggleWish=async(id)=>{const has=wishlist.some(x=>x.product_id===id);if(has)await api.delete(`/shop/wishlist/${id}`);else await api.post(`/shop/wishlist/${id}`);setWishlist((await api.get('/shop/wishlist')).data)};
return <C.Provider value={{user,cart,wishlist,loading,refresh,logout,addCart,toggleWish}}>{children}</C.Provider>}
