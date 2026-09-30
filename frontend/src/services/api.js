import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',timeout:15000});
api.interceptors.request.use(c=>{const t=localStorage.getItem('ft_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
export const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
