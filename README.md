# Fashion Trends — Production-Oriented Ecommerce Starter

A full-stack ecommerce application built with React + Vite, Node.js + Express, PostgreSQL/Neon, JWT authentication, OTP verification, Razorpay-ready payments, shipment tracking, and a comprehensive admin console.

## Included
- Customer registration with mobile OTP verification
- Mobile OTP login
- Password login-ready account structure
- Product catalog, categories, variants, images
- Search, filters, cart and wishlist
- Address management
- Checkout and order creation
- Payment records + Razorpay integration hooks
- Shipment/tracking timeline
- Coupons, reviews, banners
- Admin dashboard with product/category/customer/order/payment/inventory/coupon/review/banner/settings/admin-user/audit-log sections
- Secure headers, CORS, rate limiting, password hashing, JWT auth, validation
- Responsive fashion-focused UI
- Proper empty/error states with an illustration

## 1. Configure environment
Server:
```bash
cd server
copy .env.example .env
```
Put your Neon `DATABASE_URL` in `server/.env` and set a strong `JWT_SECRET`.

Client:
```bash
cd client
copy .env.example .env
```

## 2. Create all database tables
From project root:
```bash
npm install
npm run db:migrate
npm run db:seed
```
The migration creates the complete schema. The seed creates categories, demo products, and the admin account.

## 3. Run
```bash
npm run dev
```
Frontend: http://localhost:5173
Backend: http://localhost:5000
Health: http://localhost:5000/api/health

## Admin credentials
Email: `admin@fashiontrends.local`
Password: `ChangeMe@2026!`

Change this password immediately after first login in a real deployment.

## OTP
Local development uses a console OTP provider. The generated OTP is printed by the server. For production, replace `server/src/services/otp.service.js` with your SMS provider (Twilio, MSG91, AWS SNS, etc.) and set `OTP_PROVIDER` accordingly.

## Payments
The payment page supports COD immediately. Razorpay order creation/verification endpoints are included and become active after `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured.

## Deployment
- Frontend: Vercel/Netlify/static hosting
- Backend: Render/Railway/Fly.io/AWS
- Database: Neon PostgreSQL
- Configure HTTPS, production secrets, real SMS OTP provider, Razorpay live keys, object storage/CDN for product images, and a transactional email provider before going live.
