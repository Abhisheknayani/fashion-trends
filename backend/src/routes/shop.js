import { Router } from 'express';
import { z } from 'zod';
import { q, pool } from '../db/pool.js';
import { auth } from '../utils/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

const r = Router();

const userId = (req) => req.user.id;

/* =========================================================
   CURRENT USER
========================================================= */

r.get('/me', auth, async (req, res, next) => {
  try {
    const x = await q(
      `SELECT id,
              name,
              email,
              mobile,
              mobile_verified,
              status,
              created_at
       FROM users
       WHERE id = $1`,
      [userId(req)]
    );

    res.json(x.rows[0]);
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   CART
========================================================= */

r.get('/cart', auth, async (req, res, next) => {
  try {
    const x = await q(
      `SELECT
          c.id AS cart_id,
          ci.id AS item_id,
          ci.quantity,
          p.id AS product_id,
          p.name,
          p.price,
          p.compare_at_price,
          p.slug,

          (
            SELECT image_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY sort_order
            LIMIT 1
          ) AS image_url,

          v.id AS variant_id,
          v.sku,
          v.size,
          v.color,
          v.stock

       FROM carts c

       LEFT JOIN cart_items ci
         ON ci.cart_id = c.id

       LEFT JOIN products p
         ON p.id = ci.product_id

       LEFT JOIN product_variants v
         ON v.id = ci.variant_id

       WHERE c.user_id = $1

       ORDER BY ci.created_at DESC`,
      [userId(req)]
    );

    res.json(x.rows.filter((item) => item.item_id));
  } catch (e) {
    next(e);
  }
});

r.post('/cart', auth, async (req, res, next) => {
  try {
    const {
      productId,
      variantId,
      quantity = 1
    } = req.body;

    const parsedQuantity = Math.max(1, Number(quantity));

    const c = await q(
      `INSERT INTO carts(user_id)
       VALUES($1)

       ON CONFLICT(user_id)
       DO UPDATE SET updated_at = NOW()

       RETURNING id`,
      [userId(req)]
    );

    await q(
      `INSERT INTO cart_items(
          cart_id,
          product_id,
          variant_id,
          quantity
       )
       VALUES($1, $2, $3, $4)

       ON CONFLICT(cart_id, product_id, variant_id)

       DO UPDATE SET
          quantity = cart_items.quantity + EXCLUDED.quantity`,
      [
        c.rows[0].id,
        productId,
        variantId || null,
        parsedQuantity
      ]
    );

    res.json({
      message: 'Added to cart'
    });
  } catch (e) {
    next(e);
  }
});

r.patch('/cart/:itemId', auth, async (req, res, next) => {
  try {
    const quantity = Math.max(
      1,
      Number(req.body.quantity)
    );

    await q(
      `UPDATE cart_items ci

       SET quantity = $1

       FROM carts c

       WHERE ci.id = $2
         AND ci.cart_id = c.id
         AND c.user_id = $3`,
      [
        quantity,
        req.params.itemId,
        userId(req)
      ]
    );

    res.json({
      message: 'Cart updated'
    });
  } catch (e) {
    next(e);
  }
});

r.delete('/cart/:itemId', auth, async (req, res, next) => {
  try {
    await q(
      `DELETE FROM cart_items ci

       USING carts c

       WHERE ci.id = $1
         AND ci.cart_id = c.id
         AND c.user_id = $2`,
      [
        req.params.itemId,
        userId(req)
      ]
    );

    res.json({
      message: 'Removed'
    });
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   WISHLIST
========================================================= */

r.get('/wishlist', auth, async (req, res, next) => {
  try {
    const result = await q(
      `SELECT
          w.*,
          p.name,
          p.slug,
          p.price,

          (
            SELECT image_url
            FROM product_images pi
            WHERE pi.product_id = p.id
            ORDER BY sort_order
            LIMIT 1
          ) AS image_url

       FROM wishlists w

       JOIN products p
         ON p.id = w.product_id

       WHERE w.user_id = $1

       ORDER BY w.created_at DESC`,
      [userId(req)]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
});

r.post('/wishlist/:productId', auth, async (req, res, next) => {
  try {
    await q(
      `INSERT INTO wishlists(
          user_id,
          product_id
       )
       VALUES($1, $2)

       ON CONFLICT DO NOTHING`,
      [
        userId(req),
        req.params.productId
      ]
    );

    res.json({
      message: 'Added to wishlist'
    });
  } catch (e) {
    next(e);
  }
});

r.delete('/wishlist/:productId', auth, async (req, res, next) => {
  try {
    await q(
      `DELETE FROM wishlists
       WHERE user_id = $1
         AND product_id = $2`,
      [
        userId(req),
        req.params.productId
      ]
    );

    res.json({
      message: 'Removed'
    });
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   ADDRESSES
========================================================= */

r.get('/addresses', auth, async (req, res, next) => {
  try {
    const result = await q(
      `SELECT *
       FROM addresses

       WHERE user_id = $1

       ORDER BY
         is_default DESC,
         created_at DESC`,
      [userId(req)]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
});

r.post('/addresses', auth, async (req, res, next) => {
  try {
    const a = z
      .object({
        label: z.string().optional(),
        recipientName: z.string().min(2),
        mobile: z.string().min(10),
        line1: z.string().min(3),
        line2: z.string().optional(),
        city: z.string().min(2),
        state: z.string().min(2),
        postalCode: z.string().min(4),
        country: z.string().default('India'),
        isDefault: z.boolean().default(false)
      })
      .parse(req.body);

    if (a.isDefault) {
      await q(
        `UPDATE addresses
         SET is_default = false
         WHERE user_id = $1`,
        [userId(req)]
      );
    }

    const x = await q(
      `INSERT INTO addresses(
          user_id,
          label,
          recipient_name,
          mobile,
          line1,
          line2,
          city,
          state,
          postal_code,
          country,
          is_default
       )

       VALUES(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
       )

       RETURNING *`,
      [
        userId(req),
        a.label || 'Home',
        a.recipientName,
        a.mobile,
        a.line1,
        a.line2 || null,
        a.city,
        a.state,
        a.postalCode,
        a.country,
        a.isDefault
      ]
    );

    res.status(201).json(x.rows[0]);
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   CHECKOUT
========================================================= */

r.post('/checkout', auth, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* -----------------------------------------------------
       1. Lock the user's cart items

       IMPORTANT:
       Do NOT use FOR UPDATE on the original query because
       product_variants is a nullable side of a LEFT JOIN.
    ----------------------------------------------------- */

    const cartLock = await client.query(
      `SELECT
          ci.id

       FROM cart_items ci

       JOIN carts c
         ON c.id = ci.cart_id

       WHERE c.user_id = $1

       FOR UPDATE OF ci`,
      [userId(req)]
    );

    if (!cartLock.rowCount) {
      throw Object.assign(
        new Error('Your cart is empty'),
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       2. Read cart items WITHOUT FOR UPDATE
    ----------------------------------------------------- */

    const items = await client.query(
      `SELECT
          ci.*,

          p.name,
          p.price,

          v.sku,
          v.size,
          v.color,
          v.stock

       FROM cart_items ci

       JOIN carts c
         ON c.id = ci.cart_id

       JOIN products p
         ON p.id = ci.product_id

       LEFT JOIN product_variants v
         ON v.id = ci.variant_id

       WHERE c.user_id = $1

       ORDER BY ci.created_at ASC`,
      [userId(req)]
    );

    if (!items.rowCount) {
      throw Object.assign(
        new Error('Your cart is empty'),
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       3. Validate address
    ----------------------------------------------------- */

    const addr = await client.query(
      `SELECT *
       FROM addresses

       WHERE id = $1
         AND user_id = $2`,
      [
        req.body.addressId,
        userId(req)
      ]
    );

    if (!addr.rowCount) {
      throw Object.assign(
        new Error('Please select a valid address'),
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       4. Calculate totals
    ----------------------------------------------------- */

    const subtotal = items.rows.reduce(
      (sum, item) =>
        sum +
        Number(item.price) * Number(item.quantity),
      0
    );

    const shipping = subtotal >= 1999 ? 0 : 99;

    const tax =
      Math.round(subtotal * 0.05 * 100) / 100;

    const total =
      subtotal +
      shipping +
      tax;

    /* -----------------------------------------------------
       5. Create order number
    ----------------------------------------------------- */

    const number =
      `FT${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

    /* -----------------------------------------------------
       6. Create order
    ----------------------------------------------------- */

    const order = await client.query(
      `INSERT INTO orders(
          order_number,
          user_id,
          address_id,
          subtotal,
          shipping_fee,
          tax,
          total,
          status,
          payment_status
       )

       VALUES(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'pending',
          'pending'
       )

       RETURNING *`,
      [
        number,
        userId(req),
        req.body.addressId,
        subtotal,
        shipping,
        tax,
        total
      ]
    );

    const createdOrder = order.rows[0];

    /* -----------------------------------------------------
       7. Process each item

       Inventory update is atomic:
       stock is reduced ONLY if enough inventory exists.

       This avoids overselling during concurrent checkout.
    ----------------------------------------------------- */

    for (const item of items.rows) {
      /* -----------------------------------------------
         Variant inventory
      ------------------------------------------------ */

      if (item.variant_id) {
        const inventory = await client.query(
          `UPDATE product_variants

           SET stock = stock - $1

           WHERE id = $2
             AND stock >= $1

           RETURNING id, stock`,
          [
            Number(item.quantity),
            item.variant_id
          ]
        );

        if (!inventory.rowCount) {
          throw Object.assign(
            new Error(
              `Insufficient stock for ${item.name}` +
              (item.size ? ` (${item.size})` : '')
            ),
            { status: 409 }
          );
        }
      }

      /* -----------------------------------------------
         Order item
      ------------------------------------------------ */

      await client.query(
        `INSERT INTO order_items(
            order_id,
            product_id,
            variant_id,
            product_name,
            sku,
            size,
            color,
            quantity,
            unit_price,
            total_price
         )

         VALUES(
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
         )`,
        [
          createdOrder.id,
          item.product_id,
          item.variant_id,
          item.name,
          item.sku,
          item.size,
          item.color,
          item.quantity,
          item.price,
          Number(item.price) * Number(item.quantity)
        ]
      );
    }

    /* -----------------------------------------------------
       8. Clear cart
    ----------------------------------------------------- */

    await client.query(
      `DELETE FROM cart_items

       WHERE cart_id = (
         SELECT id
         FROM carts
         WHERE user_id = $1
       )`,
      [userId(req)]
    );

    /* -----------------------------------------------------
       9. Create shipment
    ----------------------------------------------------- */

    const shipment = await client.query(
      `INSERT INTO shipments(
          order_id,
          status
       )

       VALUES(
          $1,
          'order_placed'
       )

       RETURNING id`,
      [createdOrder.id]
    );

    /* -----------------------------------------------------
       10. Create shipment event
    ----------------------------------------------------- */

    await client.query(
      `INSERT INTO shipment_events(
          shipment_id,
          status,
          message
       )

       VALUES(
          $1,
          'order_placed',
          'Order placed successfully'
       )`,
      [shipment.rows[0].id]
    );

    /* -----------------------------------------------------
       11. Commit
    ----------------------------------------------------- */

    await client.query('COMMIT');

    res.status(201).json(createdOrder);
  } catch (e) {
    await client.query('ROLLBACK');

    next(e);
  } finally {
    client.release();
  }
});

/* =========================================================
   ORDERS
========================================================= */

r.get('/orders', auth, async (req, res, next) => {
  try {
    const result = await q(
      `SELECT
          o.*,
          s.tracking_number,
          s.carrier,
          s.status AS shipment_status

       FROM orders o

       LEFT JOIN shipments s
         ON s.order_id = o.id

       WHERE o.user_id = $1

       ORDER BY o.created_at DESC`,
      [userId(req)]
    );

    res.json(result.rows);
  } catch (e) {
    next(e);
  }
});

r.get('/orders/:id', auth, async (req, res, next) => {
  try {
    const o = await q(
      `SELECT
          o.*,

          a.recipient_name,
          a.mobile,
          a.line1,
          a.line2,
          a.city,
          a.state,
          a.postal_code,

          s.id AS shipment_id,
          s.tracking_number,
          s.carrier,
          s.status AS shipment_status

       FROM orders o

       LEFT JOIN addresses a
         ON a.id = o.address_id

       LEFT JOIN shipments s
         ON s.order_id = o.id

       WHERE o.id = $1
         AND o.user_id = $2`,
      [
        req.params.id,
        userId(req)
      ]
    );

    if (!o.rowCount) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    const items = await q(
      `SELECT *
       FROM order_items
       WHERE order_id = $1`,
      [req.params.id]
    );

    const events = await q(
      `SELECT
          se.*

       FROM shipment_events se

       JOIN shipments s
         ON s.id = se.shipment_id

       WHERE s.order_id = $1

       ORDER BY event_at`,
      [req.params.id]
    );

    res.json({
      ...o.rows[0],
      items: items.rows,
      events: events.rows
    });
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   RAZORPAY - CREATE ORDER
========================================================= */

r.post(
  '/payments/razorpay/order',
  auth,
  async (req, res, next) => {
    try {
      if (
        !env.razorpayKey ||
        !env.razorpaySecret
      ) {
        return res.status(503).json({
          message:
            'Online payment is not configured. ' +
            'Use Cash on Delivery or configure Razorpay keys.'
        });
      }

      const o = await q(
        `SELECT *
         FROM orders

         WHERE id = $1
           AND user_id = $2`,
        [
          req.body.orderId,
          userId(req)
        ]
      );

      if (!o.rowCount) {
        return res.status(404).json({
          message: 'Order not found'
        });
      }

      const rz = new Razorpay({
        key_id: env.razorpayKey,
        key_secret: env.razorpaySecret
      });

      const ro = await rz.orders.create({
        amount: Math.round(
          Number(o.rows[0].total) * 100
        ),
        currency: 'INR',
        receipt: o.rows[0].order_number
      });

      await q(
        `INSERT INTO payments(
            order_id,
            provider,
            provider_order_id,
            amount,
            status
         )

         VALUES(
            $1,
            'razorpay',
            $2,
            $3,
            'created'
         )`,
        [
          o.rows[0].id,
          ro.id,
          o.rows[0].total
        ]
      );

      res.json({
        key: env.razorpayKey,
        order: ro
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   RAZORPAY - VERIFY PAYMENT
========================================================= */

r.post(
  '/payments/razorpay/verify',
  auth,
  async (req, res, next) => {
    try {
      const {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      const expected =
        crypto
          .createHmac(
            'sha256',
            env.razorpaySecret
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`
          )
          .digest('hex');

      if (
        expected !== razorpay_signature
      ) {
        return res.status(400).json({
          message:
            'Payment signature verification failed'
        });
      }

      await q(
        `UPDATE payments

         SET
           provider_payment_id = $1,
           status = 'paid',
           method = 'razorpay',
           updated_at = NOW()

         WHERE order_id = $2
           AND provider_order_id = $3`,
        [
          razorpay_payment_id,
          orderId,
          razorpay_order_id
        ]
      );

      await q(
        `UPDATE orders

         SET
           payment_status = 'paid',
           status = 'confirmed',
           updated_at = NOW()

         WHERE id = $1
           AND user_id = $2`,
        [
          orderId,
          userId(req)
        ]
      );

      res.json({
        message: 'Payment verified'
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   CASH ON DELIVERY
========================================================= */

r.post('/payments/cod', auth, async (req, res, next) => {
  try {
    const order = await q(
      `SELECT id, total
       FROM orders

       WHERE id = $1
         AND user_id = $2`,
      [
        req.body.orderId,
        userId(req)
      ]
    );

    if (!order.rowCount) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    await q(
      `INSERT INTO payments(
          order_id,
          provider,
          amount,
          status,
          method
       )

       VALUES(
          $1,
          'cod',
          $2,
          'pending',
          'cash_on_delivery'
       )`,
      [
        order.rows[0].id,
        order.rows[0].total
      ]
    );

    await q(
      `UPDATE orders

       SET
         payment_status = 'cod',
         status = 'confirmed',
         updated_at = NOW()

       WHERE id = $1
         AND user_id = $2`,
      [
        req.body.orderId,
        userId(req)
      ]
    );

    res.json({
      message: 'COD confirmed'
    });
  } catch (e) {
    next(e);
  }
});

export default r;