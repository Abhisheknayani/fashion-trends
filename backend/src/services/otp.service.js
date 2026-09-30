import crypto from 'crypto';
import { q } from '../db/pool.js';
import { env } from '../config/env.js';

function normalizeMobile(mobile) {
  return String(mobile).trim();
}

function normalizeOtp(otp) {
  return String(otp).trim();
}

function hashOtp(otp) {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
}

export async function sendOtp(mobile, purpose) {
  const normalizedMobile = normalizeMobile(mobile);

  const otp = String(
    crypto.randomInt(100000, 1000000)
  );

  const hash = hashOtp(otp);

  // Remove previous OTP for this mobile + purpose
  await q(
    `
      DELETE FROM otp_verifications
      WHERE mobile = $1
        AND purpose = $2
    `,
    [normalizedMobile, purpose]
  );

  // Create new OTP
  await q(
    `
      INSERT INTO otp_verifications
        (
          mobile,
          purpose,
          otp_hash,
          expires_at,
          attempts
        )
      VALUES
        (
          $1,
          $2,
          $3,
          NOW() + ($4::text || ' minutes')::interval,
          0
        )
    `,
    [
      normalizedMobile,
      purpose,
      hash,
      String(env.otpTtl)
    ]
  );

  // Development only
  console.log(
    `[OTP ${purpose}] ${normalizedMobile}: ${otp}`
  );

  return {
    sent: true,

    ...(env.nodeEnv !== 'production'
      ? { devOtp: otp }
      : {})
  };
}

export async function verifyOtp(
  mobile,
  purpose,
  otp
) {
  const normalizedMobile = normalizeMobile(mobile);
  const normalizedOtp = normalizeOtp(otp);

  // OTP must be exactly 6 digits
  if (!/^\d{6}$/.test(normalizedOtp)) {
    return false;
  }

  const hash = hashOtp(normalizedOtp);

  const result = await q(
    `
      SELECT *
      FROM otp_verifications
      WHERE mobile = $1
        AND purpose = $2
        AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [
      normalizedMobile,
      purpose
    ]
  );

  const row = result.rows[0];

  if (!row) {
    return false;
  }

  // OTP expired
  if (new Date(row.expires_at) < new Date()) {
    return false;
  }

  // Too many attempts
  if ((row.attempts ?? 0) >= 5) {
    return false;
  }

  // Incorrect OTP
  if (row.otp_hash !== hash) {
    await q(
      `
        UPDATE otp_verifications
        SET attempts = attempts + 1
        WHERE id = $1
      `,
      [row.id]
    );

    return false;
  }

  // OTP successfully verified
  await q(
    `
      UPDATE otp_verifications
      SET verified_at = NOW()
      WHERE id = $1
    `,
    [row.id]
  );

  return true;
}