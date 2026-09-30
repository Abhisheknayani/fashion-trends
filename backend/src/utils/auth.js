import jwt from 'jsonwebtoken'; import { env } from '../config/env.js';
export const signToken=(payload)=>jwt.sign(payload,env.jwtSecret,{expiresIn:'7d'});
export const auth=(req,res,next)=>{try{const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({message:'Authentication required'}); req.user=jwt.verify(h.slice(7),env.jwtSecret); next();}catch{return res.status(401).json({message:'Invalid or expired session'});}};
export const adminAuth=(req,res,next)=>auth(req,res,()=>req.user?.type==='admin'?next():res.status(403).json({message:'Admin access required'}));
