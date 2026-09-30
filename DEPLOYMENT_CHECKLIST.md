# Production deployment checklist

## Required before go-live
- [ ] Replace `JWT_SECRET` with a long random production secret.
- [ ] Configure Neon `DATABASE_URL` in the backend host.
- [ ] Run `npm run db:migrate` once against the production database.
- [ ] Run `npm run db:seed` only for the initial environment.
- [ ] Change the seeded admin password immediately.
- [ ] Configure a real SMS OTP provider; console OTP is for development only.
- [ ] Configure Razorpay live keys and webhook verification before accepting online payments.
- [ ] Configure object storage/CDN for product media rather than relying on demo Unsplash URLs.
- [ ] Configure HTTPS and restrict CORS to the production frontend domain.
- [ ] Add transactional email/SMS templates and operational alerts.
- [ ] Add backups/point-in-time recovery and database monitoring in Neon.
- [ ] Add structured logs and error monitoring.
- [ ] Load-test checkout and catalog APIs before a major launch.

## Important
The supplied Neon credential is intentionally not embedded in source files. Put it in `server/.env` locally or in your deployment provider's secret environment variables.
