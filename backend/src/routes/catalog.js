import { Router } from 'express';
import { q } from '../db/pool.js';

const r = Router();


/* =========================================================
   GET ACTIVE CATEGORIES
   GET /api/catalog/categories

   Returns:
   - id
   - name
   - slug
   - description
   - image_url
   - is_active
========================================================= */

r.get('/categories', async (req, res, next) => {
  try {

    const result = await q(`
      SELECT
        id,
        name,
        slug,
        description,
        image_url,
        is_active
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json(result.rows);

  } catch (e) {
    console.error(
      'GET /api/catalog/categories error:',
      e
    );

    next(e);
  }
});


/* =========================================================
   GET PRODUCTS
   GET /api/catalog/products

   Supported query parameters:

   ?category=men
   ?category=women
   ?category=kids
   ?q=shirt
   ?sort=newest
   ?sort=price_asc
   ?sort=price_desc
   ?sort=rating
   ?limit=24
   ?offset=0
========================================================= */

r.get('/products', async (req, res, next) => {

  try {

    const {
      q: searchTerm,
      category,
      sort = 'newest',
      limit = 24,
      offset = 0
    } = req.query;


    /* =====================================================
       PARAMETERS
    ===================================================== */

    const values = [];


    /* =====================================================
       BASE FILTER
    ===================================================== */

    const conditions = [
      `p.status = 'active'`
    ];


    /* =====================================================
       SEARCH FILTER

       Searches:
       - Product name
       - Brand
       - Category name
       - Category slug
       - SKU
    ===================================================== */

    if (
      searchTerm &&
      String(searchTerm).trim()
    ) {

      const search = `%${String(searchTerm).trim()}%`;

      values.push(search);

      const index = values.length;

      conditions.push(`
        (
          p.name ILIKE $${index}
          OR p.brand ILIKE $${index}
          OR c.name ILIKE $${index}
          OR c.slug ILIKE $${index}
          OR EXISTS (
            SELECT 1
            FROM product_variants pv_search
            WHERE pv_search.product_id = p.id
              AND (
                pv_search.sku ILIKE $${index}
              )
          )
        )
      `);
    }


    /* =====================================================
       CATEGORY FILTER

       Allows:

       men
       Men
       MEN

       It also checks both category.slug
       and category.name.
    ===================================================== */

    if (
      category &&
      String(category).trim()
    ) {

      const categoryValue =
        String(category).trim();

      values.push(categoryValue);

      const index = values.length;

      conditions.push(`
        (
          LOWER(TRIM(c.slug)) = LOWER(TRIM($${index}))
          OR
          LOWER(TRIM(c.name)) = LOWER(TRIM($${index}))
        )
      `);
    }


    /* =====================================================
       WHERE CLAUSE
    ===================================================== */

    const whereClause = `
      WHERE ${conditions.join('\nAND ')}
    `;


    /* =====================================================
       SORTING
    ===================================================== */

    let orderBy;

    switch (sort) {

      case 'price_asc':

        orderBy = `
          p.price ASC,
          p.created_at DESC
        `;

        break;


      case 'price_desc':

        orderBy = `
          p.price DESC,
          p.created_at DESC
        `;

        break;


      case 'rating':

        orderBy = `
          p.rating DESC NULLS LAST,
          p.created_at DESC
        `;

        break;


      case 'newest':

      default:

        orderBy = `
          p.created_at DESC
        `;

        break;
    }


    /* =====================================================
       PAGINATION
    ===================================================== */

    const requestedLimit =
      Number.parseInt(limit, 10);

    const requestedOffset =
      Number.parseInt(offset, 10);

    const safeLimit =
      Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 60)
        : 24;

    const safeOffset =
      Number.isFinite(requestedOffset)
        ? Math.max(requestedOffset, 0)
        : 0;


    values.push(safeLimit);

    const limitIndex = values.length;


    values.push(safeOffset);

    const offsetIndex = values.length;


    /* =====================================================
       PRODUCT QUERY
    ===================================================== */

    const sql = `
      SELECT
        p.*,

        c.name AS category_name,

        c.slug AS category_slug,

        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ) AS image_url,

        (
          SELECT
            json_agg(
              json_build_object(
                'id', v.id,
                'sku', v.sku,
                'size', v.size,
                'color', v.color,
                'stock', v.stock,
                'price', v.price
              )
              ORDER BY v.id
            )
          FROM product_variants v
          WHERE v.product_id = p.id
            AND v.is_active = true
        ) AS variants

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      ${whereClause}

      ORDER BY ${orderBy}

      LIMIT $${limitIndex}

      OFFSET $${offsetIndex}
    `;


    const result = await q(
      sql,
      values
    );


    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json(result.rows);

  } catch (e) {

    console.error(
      'GET /api/catalog/products error:',
      e
    );

    next(e);
  }
});


/* =========================================================
   GET SINGLE PRODUCT
   GET /api/catalog/products/:slug
========================================================= */

r.get(
  '/products/:slug',
  async (req, res, next) => {

    try {

      const result = await q(
        `
        SELECT

          p.*,

          c.name AS category_name,

          c.slug AS category_slug,

          (
            SELECT
              json_agg(
                pi
                ORDER BY pi.sort_order ASC
              )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ) AS images,

          (
            SELECT
              json_agg(
                v
                ORDER BY v.id
              )
            FROM product_variants v
            WHERE v.product_id = p.id
              AND v.is_active = true
          ) AS variants

        FROM products p

        LEFT JOIN categories c
          ON c.id = p.category_id

        WHERE p.slug = $1

        LIMIT 1
        `,
        [req.params.slug]
      );


      if (!result.rowCount) {

        return res.status(404).json({
          message: 'Product not found'
        });

      }


      res.json(
        result.rows[0]
      );

    } catch (e) {

      next(e);
    }
  }
);


export default r;