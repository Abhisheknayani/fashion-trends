import 'dotenv/config';
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development', port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL, jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173', otpTtl: Number(process.env.OTP_TTL_MINUTES || 5),
  razorpayKey: process.env.RAZORPAY_KEY_ID, razorpaySecret: process.env.RAZORPAY_KEY_SECRET
};
if (!env.databaseUrl) console.warn('DATABASE_URL is not set. Database APIs will fail until configured.');
