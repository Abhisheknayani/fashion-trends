import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { q } from '../db/pool.js';

import {
  sendOtp,
  verifyOtp
} from '../services/otp.service.js';

import { signToken } from '../utils/auth.js';

const r = Router();

/* =========================================================
   VALIDATION
========================================================= */

const mobile = z
  .string()
  .min(10)
  .max(20);

const reg = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile,
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
});


/* =========================================================
   CUSTOMER REGISTER - REQUEST OTP
========================================================= */

r.post(
  '/register/request-otp',
  async (req, res, next) => {
    try {
      const d = reg.parse(req.body);

      if (d.password !== d.confirmPassword) {
        return res
          .status(400)
          .json({
            message: 'Passwords do not match'
          });
      }

      const exists = await q(
        `
          SELECT 1
          FROM users
          WHERE email = $1
             OR mobile = $2
        `,
        [
          d.email,
          d.mobile
        ]
      );

      if (exists.rowCount) {
        return res
          .status(409)
          .json({
            message:
              'Email or mobile number already registered'
          });
      }

      const otp = await sendOtp(
        d.mobile,
        'register'
      );

      res.json({
        message: 'OTP sent to mobile number',
        ...otp
      });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   CUSTOMER REGISTER - VERIFY OTP
========================================================= */

r.post(
  '/register/verify',
  async (req, res, next) => {
    try {
      const d = reg.parse(req.body);

      if (d.password !== d.confirmPassword) {
        return res
          .status(400)
          .json({
            message: 'Passwords do not match'
          });
      }

      const valid = await verifyOtp(
        d.mobile,
        'register',
        req.body.otp
      );

      if (!valid) {
        return res
          .status(400)
          .json({
            message:
              'Invalid or expired OTP'
          });
      }

      const hash = await bcrypt.hash(
        d.password,
        12
      );

      const u = await q(
        `
          INSERT INTO users
          (
            name,
            email,
            mobile,
            password_hash,
            mobile_verified
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            true
          )
          RETURNING
            id,
            name,
            email,
            mobile
        `,
        [
          d.name,
          d.email,
          d.mobile,
          hash
        ]
      );

      const user = u.rows[0];

      await q(
        `
          INSERT INTO carts(user_id)
          VALUES($1)
          ON CONFLICT DO NOTHING
        `,
        [user.id]
      );

      res
        .status(201)
        .json({
          user,
          token: signToken({
            id: user.id,
            type: 'user'
          })
        });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   CUSTOMER LOGIN - REQUEST OTP
========================================================= */

r.post(
  '/login/request-otp',
  async (req, res, next) => {
    try {
      const m = mobile.parse(
        req.body.mobile
      );

      const u = await q(
        `
          SELECT id
          FROM users
          WHERE mobile = $1
            AND status = $2
        `,
        [
          m,
          'active'
        ]
      );

      if (!u.rowCount) {
        return res
          .status(404)
          .json({
            message: 'Account not found'
          });
      }

      const otp = await sendOtp(
        m,
        'login'
      );

      res.json({
        message: 'OTP sent',
        ...otp
      });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   CUSTOMER LOGIN - VERIFY OTP
========================================================= */

r.post(
  '/login/verify',
  async (req, res, next) => {
    try {
      const m = mobile.parse(
        req.body.mobile
      );

      const valid = await verifyOtp(
        m,
        'login',
        req.body.otp
      );

      if (!valid) {
        return res
          .status(400)
          .json({
            message:
              'Invalid or expired OTP'
          });
      }

      const u = await q(
        `
          SELECT
            id,
            name,
            email,
            mobile
          FROM users
          WHERE mobile = $1
            AND status = $2
        `,
        [
          m,
          'active'
        ]
      );

      if (!u.rowCount) {
        return res
          .status(404)
          .json({
            message: 'Account not found'
          });
      }

      res.json({
        user: u.rows[0],

        token: signToken({
          id: u.rows[0].id,
          type: 'user'
        })
      });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   ADMIN LOGIN - REQUEST OTP
========================================================= */

r.post(
  '/admin/login/request-otp',
  async (req, res, next) => {
    try {
      const m = mobile.parse(
        req.body.mobile
      );

      /*
       * Find active administrator
       * using mobile number.
       */

      const admin = await q(
        `
          SELECT
            id,
            name,
            email,
            mobile,
            role,
            status
          FROM admins
          WHERE mobile = $1
            AND status = $2
        `,
        [
          m,
          'active'
        ]
      );

      if (!admin.rowCount) {
        return res
          .status(404)
          .json({
            message:
              'No active admin account found for this mobile number'
          });
      }

      /*
       * Send admin OTP.
       *
       * IMPORTANT:
       * Admin OTP uses a separate purpose
       * from customer login OTP.
       */

      const otp = await sendOtp(
        m,
        'admin-login'
      );

      res.json({
        message:
          'Admin OTP sent to mobile number',

        /*
         * In development, otp.service.js
         * returns devOtp.
         *
         * In production, the OTP should
         * never be returned in the API response.
         */

        ...otp
      });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   ADMIN LOGIN - VERIFY OTP
========================================================= */

r.post(
  '/admin/login/verify',
  async (req, res, next) => {
    try {
      const m = mobile.parse(
        req.body.mobile
      );

      /*
       * OTP must be exactly
       * 6 numeric digits.
       *
       * This matches otp.service.js,
       * which generates a 6-digit OTP.
       */

      const otp = z
        .string()
        .regex(
          /^\d{6}$/,
          'OTP must be exactly 6 digits'
        )
        .parse(req.body.otp);

      /*
       * Verify admin OTP.
       */

      const valid = await verifyOtp(
        m,
        'admin-login',
        otp
      );

      if (!valid) {
        return res
          .status(400)
          .json({
            message:
              'Invalid or expired admin OTP'
          });
      }

      /*
       * Fetch active admin
       * again after OTP verification.
       */

      const result = await q(
        `
          SELECT
            id,
            name,
            email,
            mobile,
            role,
            status
          FROM admins
          WHERE mobile = $1
            AND status = $2
        `,
        [
          m,
          'active'
        ]
      );

      if (!result.rowCount) {
        return res
          .status(404)
          .json({
            message:
              'Admin account not found or inactive'
          });
      }

      const admin = result.rows[0];

      /*
       * Update last login.
       */

      await q(
        `
          UPDATE admins
          SET last_login_at = NOW()
          WHERE id = $1
        `,
        [admin.id]
      );

      /*
       * Create ADMIN JWT.
       *
       * type = admin
       *
       * This allows the backend to distinguish
       * an administrator from a normal customer.
       */

      const token = signToken({
        id: admin.id,
        type: 'admin',
        role: admin.role
      });

      res.json({
        message:
          'Admin login successful',

        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role
        },

        token
      });

    } catch (e) {
      next(e);
    }
  }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

export default r;