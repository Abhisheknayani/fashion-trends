import bcrypt from 'bcryptjs'; import { pool } from './pool.js';
const adminPassword = await bcrypt.hash('ChangeMe@2026!', 12);
await pool.query(`INSERT INTO admins(name,email,password_hash,role) VALUES($1,$2,$3,'super_admin') ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,['Fashion Trends Admin','admin@fashiontrends.local',adminPassword]);
const categories=[['Men','men'],['Women','women'],['Kids','kids'],['Footwear','footwear'],['Accessories','accessories']];
for(const [name,slug] of categories) await pool.query(`INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO NOTHING`,[name,slug]);
const cat=await pool.query('SELECT id,slug FROM categories'); const map=Object.fromEntries(cat.rows.map(r=>[r.slug,r.id]));
const products=[
['Classic Oxford Shirt','classic-oxford-shirt','Premium cotton oxford shirt with a tailored fit.','Fashion Trends',1299,1799,'men'],
['Relaxed Fit Denim','relaxed-fit-denim','Comfort stretch denim for everyday wear.','Fashion Trends',1899,2499,'men'],
['Floral Midi Dress','floral-midi-dress','Lightweight floral midi dress for effortless styling.','Fashion Trends',2199,2999,'women'],
['Everyday Sneakers','everyday-sneakers','Minimal sneakers with cushioned everyday comfort.','Fashion Trends',2499,3299,'footwear'],
['Structured Tote Bag','structured-tote-bag','Roomy structured tote for work and travel.','Fashion Trends',1599,2199,'accessories'],
['Kids Graphic Tee','kids-graphic-tee','Soft cotton graphic tee for active days.','Fashion Trends',699,999,'kids']];
for(const p of products){const r=await pool.query(`INSERT INTO products(name,slug,description,brand,price,compare_at_price,category_id,featured) VALUES($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT(slug) DO UPDATE SET price=EXCLUDED.price RETURNING id`,[p[0],p[1],p[2],p[3],p[4],p[5],map[p[6]]]); const id=r.rows[0].id; await pool.query(`INSERT INTO product_images(product_id,image_url,alt_text,sort_order) SELECT $1,$2,$3,0 WHERE NOT EXISTS(SELECT 1 FROM product_images WHERE product_id=$1)`,[id,`https://images.unsplash.com/photo-${['1521572163474-6864f9cf17ab','1542291026-7eec264c27ff','1515372039744-b8f02a3ae446','1542291026-7eec264c27ff','1553062407-98eeb64c6a62','1519238263530-99bdd11df2f7'][products.indexOf(p)]}?auto=format&fit=crop&w=900&q=80`,p[0]]); await pool.query(`INSERT INTO product_variants(product_id,sku,size,color,stock) SELECT $1,$2,'M','Default',100 WHERE NOT EXISTS(SELECT 1 FROM product_variants WHERE product_id=$1)`,[id,`FT-${p[1].toUpperCase().slice(0,8)}`]);}
console.log('Seed completed. Admin: admin@fashiontrends.local / ChangeMe@2026!'); await pool.end();
