    import { Router } from 'express';
    import bcrypt from 'bcryptjs';
    import { z } from 'zod';
    import multer from 'multer';
    import path from 'path';
    import fs from 'fs';
    import { fileURLToPath } from 'url';

    import { q } from '../db/pool.js';
    import { adminAuth } from '../utils/auth.js';

    const r = Router();

    r.use(adminAuth);


    /* =========================================================
    HELPERS
    ========================================================= */

    const safe = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
    };


    /* =========================================================
    ORDER HELPERS
    ========================================================= */

    const ORDER_STATUSES = [
        'pending',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'delivered',
        'cancelled'
    ];

    const normalizeOrderStatus = (value) => {
        const status = String(value || '')
            .trim()
            .toLowerCase();

        return ORDER_STATUSES.includes(status)
            ? status
            : null;
    };

    /*
     * The project has used more than one order-item table name
     * during development. Resolve the table safely instead of
     * hard-coding one name and breaking the admin order page.
     */
    const findOrderItemsTable = async () => {

        const result = await q(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'order_items',
                'orders_orderitem',
                'order_item'
              )
            ORDER BY
              CASE table_name
                WHEN 'order_items' THEN 1
                WHEN 'orders_orderitem' THEN 2
                WHEN 'order_item' THEN 3
                ELSE 4
              END
            LIMIT 1
        `);

        return result.rows[0]?.table_name || null;
    };


    /* =========================================================
    IMAGE UPLOAD CONFIGURATION
    ========================================================= */

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const uploadDirectory = path.resolve(
    __dirname,
    '../../uploads/products'
    );

    const categoryUploadDirectory = path.resolve(
    __dirname,
    '../../uploads/categories'
    );

    fs.mkdirSync(uploadDirectory, {
    recursive: true
    });

    fs.mkdirSync(categoryUploadDirectory, {
    recursive: true
    });


    /* =========================================================
    PRODUCT IMAGE STORAGE
    ========================================================= */

    const storage = multer.diskStorage({

    destination: (_req, _file, cb) => {

        cb(
        null,
        uploadDirectory
        );

    },

    filename: (_req, file, cb) => {

        const extension =
        path.extname(
            file.originalname
        ).toLowerCase();

        const baseName = path
        .basename(
            file.originalname,
            extension
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            '-'
        )
        .replace(
            /^-+|-+$/g,
            ''
        )
        .slice(
            0,
            60
        ) || 'product-image';

        cb(
        null,
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}-${baseName}${extension}`
        );

    }

    });


    const uploadProductImages = multer({

    storage,

    limits: {

        files: 10,

        fileSize:
        5 * 1024 * 1024

    },

    fileFilter: (
        _req,
        file,
        cb
    ) => {

        const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp'
        ];

        if (
        !allowed.includes(
            file.mimetype
        )
        ) {

        return cb(
            new Error(
            'Only JPG, PNG and WEBP images are allowed.'
            )
        );

        }

        cb(
        null,
        true
        );

    }

    });


    /* =========================================================
    CATEGORY IMAGE STORAGE
    ========================================================= */

    const uploadCategoryImage = multer({

    storage: multer.diskStorage({

        destination: (
        _req,
        _file,
        cb
        ) => {

        cb(
            null,
            categoryUploadDirectory
        );

        },

        filename: (
        _req,
        file,
        cb
        ) => {

        const extension =
            path.extname(
            file.originalname
            ).toLowerCase();

        const baseName = path
            .basename(
            file.originalname,
            extension
            )
            .toLowerCase()
            .replace(
            /[^a-z0-9]+/g,
            '-'
            )
            .replace(
            /^-+|-+$/g,
            ''
            )
            .slice(
            0,
            60
            ) || 'category-image';

        cb(
            null,
            `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}-${baseName}${extension}`
        );

        }

    }),

    limits: {

        files: 1,

        fileSize:
        5 * 1024 * 1024

    },

    fileFilter: (
        _req,
        file,
        cb
    ) => {

        const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp'
        ];

        if (
        !allowed.includes(
            file.mimetype
        )
        ) {

        return cb(
            new Error(
            'Only JPG, PNG and WEBP images are allowed.'
            )
        );

        }

        cb(
        null,
        true
        );

    }

    });


    /* =========================================================
    DASHBOARD
    GET /api/admin/dashboard
    ========================================================= */

    r.get(
    '/dashboard',
    async (
        req,
        res,
        next
    ) => {

        try {

        const [
            usersResult,
            productsResult,
            ordersResult,
            revenueResult
        ] = await Promise.all([

            q(`
            SELECT COUNT(*) AS count
            FROM users
            `),

            q(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE status = 'active'
            `),

            q(`
            SELECT COUNT(*) AS count
            FROM orders
            `),

            q(`
            SELECT
                COALESCE(
                SUM(total),
                0
                ) AS revenue
            FROM orders
            WHERE payment_status IN (
                'paid',
                'cod'
            )
            `)

        ]);


        const recent =
            await q(`

            SELECT
                o.id,
                o.order_number,
                o.total,
                o.status,
                o.created_at,
                u.name

            FROM orders o

            JOIN users u
                ON u.id = o.user_id

            ORDER BY
                o.created_at DESC

            LIMIT 8

            `);


        res.json({

            stats: {

            customers:
                safe(
                usersResult.rows[0]?.count
                ),

            products:
                safe(
                productsResult.rows[0]?.count
                ),

            orders:
                safe(
                ordersResult.rows[0]?.count
                ),

            revenue:
                safe(
                revenueResult.rows[0]?.revenue
                )

            },

            recent:
            recent.rows

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    ANALYTICS
    GET /api/admin/analytics
    ========================================================= */

    r.get(
    '/analytics',
    async (
        req,
        res,
        next
    ) => {

        try {

        const dateResult =
            await q(`

            SELECT

                CURRENT_DATE::text
                AS today,

                (
                CURRENT_DATE -
                INTERVAL '29 days'
                )::date::text
                AS default_from

            `);


        const today =
            dateResult.rows[0].today;

        const defaultFrom =
            dateResult.rows[0].default_from;


        const from =
            req.query.from ||
            defaultFrom;

        const to =
            req.query.to ||
            today;


        const dateRegex =
            /^\d{4}-\d{2}-\d{2}$/;


        if (
            !dateRegex.test(from) ||
            !dateRegex.test(to)
        ) {

            return res.status(400).json({

            message:
                'Invalid date format. Use YYYY-MM-DD.'

            });

        }


        if (from > to) {

            return res.status(400).json({

            message:
                'From date cannot be after To date.'

            });

        }


        const [
            usersTodayResult,
            ordersTodayResult,
            todayRevenueResult,
            annualRevenueResult,
            totalUsersResult
        ] = await Promise.all([


            q(`

            SELECT
                COUNT(*)::int AS count

            FROM users

            WHERE created_at::date =
                    CURRENT_DATE

            `),


            q(`

            SELECT
                COUNT(*)::int AS count

            FROM orders

            WHERE created_at::date =
                    CURRENT_DATE

            `),


            q(`

            SELECT

                COALESCE(
                SUM(total),
                0
                )::numeric AS revenue

            FROM orders

            WHERE created_at::date =
                    CURRENT_DATE

                AND payment_status IN (
                'paid',
                'cod'
                )

            `),


            q(`

            SELECT

                COALESCE(
                SUM(total),
                0
                )::numeric AS revenue

            FROM orders

            WHERE created_at >=
                    DATE_TRUNC(
                    'year',
                    CURRENT_DATE
                    )

                AND created_at <
                    DATE_TRUNC(
                    'year',
                    CURRENT_DATE
                    )
                    + INTERVAL '1 year'

                AND payment_status IN (
                'paid',
                'cod'
                )

            `),


            q(`

            SELECT
                COUNT(*)::int AS count

            FROM users

            `)

        ]);


        const trendResult =
            await q(

            `

            WITH dates AS (

                SELECT

                generate_series(
                    $1::date,
                    $2::date,
                    INTERVAL '1 day'
                )::date AS day

            ),

            daily_orders AS (

                SELECT

                created_at::date AS day,

                COUNT(*)::int AS orders,

                COALESCE(

                    SUM(

                    CASE

                        WHEN payment_status IN (
                        'paid',
                        'cod'
                        )

                        THEN total

                        ELSE 0

                    END

                    ),

                    0

                )::numeric AS revenue

                FROM orders

                WHERE created_at >=
                    $1::date

                AND created_at <
                    (
                        $2::date +
                        INTERVAL '1 day'
                    )

                GROUP BY
                created_at::date

            )

            SELECT

                dates.day,

                COALESCE(
                daily_orders.orders,
                0
                )::int AS orders,

                COALESCE(
                daily_orders.revenue,
                0
                )::numeric AS revenue

            FROM dates

            LEFT JOIN daily_orders
                ON daily_orders.day =
                dates.day

            ORDER BY
                dates.day ASC

            `,

            [
                from,
                to
            ]

            );


        res.json({

            range: {

            from,
            to

            },

            summary: {

            usersToday:
                safe(
                usersTodayResult
                    .rows[0]?.count
                ),

            ordersToday:
                safe(
                ordersTodayResult
                    .rows[0]?.count
                ),

            todayRevenue:
                safe(
                todayRevenueResult
                    .rows[0]?.revenue
                ),

            annualRevenue:
                safe(
                annualRevenueResult
                    .rows[0]?.revenue
                ),

            totalUsers:
                safe(
                totalUsersResult
                    .rows[0]?.count
                )

            },

            trend:
            trendResult.rows.map(
                (row) => ({

                date:
                    row.day,

                orders:
                    safe(
                    row.orders
                    ),

                revenue:
                    safe(
                    row.revenue
                    )

                })
            )

        });

        } catch (e) {

        console.error(
            'Admin analytics error:',
            e
        );

        next(e);

        }

    }
    );


    /* =========================================================
    PRODUCTS - LIST
    ========================================================= */

    r.get(
    '/products',
    async (
        req,
        res,
        next
    ) => {

        try {

        const result =
            await q(`

            SELECT

                p.*,

                c.name AS category_name,

                c.slug AS category_slug,

                (
                SELECT
                    pi.image_url

                FROM product_images pi

                WHERE pi.product_id =
                        p.id

                ORDER BY
                    pi.sort_order

                LIMIT 1

                ) AS image_url,

                (
                SELECT

                    json_agg(

                    json_build_object(

                        'id',
                        v.id,

                        'sku',
                        v.sku,

                        'size',
                        v.size,

                        'color',
                        v.color,

                        'stock',
                        v.stock,

                        'price',
                        v.price,

                        'is_active',
                        v.is_active

                    )

                    ORDER BY
                        v.id

                    )

                FROM product_variants v

                WHERE v.product_id =
                        p.id

                ) AS variants

            FROM products p

            LEFT JOIN categories c
                ON c.id =
                p.category_id

            ORDER BY
                p.created_at DESC

            `);


        res.json(
            result.rows
        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    PRODUCTS - CREATE
    ========================================================= */

    r.post(
    '/products',

    uploadProductImages.array(
        'images',
        10
    ),

    async (
        req,
        res,
        next
    ) => {

        try {

        let variants =
            req.body.variants;


        if (
            typeof variants ===
            'string'
        ) {

            try {

            variants =
                JSON.parse(
                variants
                );

            } catch {

            return res.status(400).json({

                message:
                'Invalid variants data.'

            });

            }

        }


        const schema =
            z.object({

            name:
                z.string()
                .min(2),

            slug:
                z.string()
                .min(2),

            description:
                z.string()
                .optional(),

            brand:
                z.string()
                .optional(),

            price:
                z.coerce
                .number()
                .nonnegative(),

            compareAtPrice:
                z.coerce
                .number()
                .nonnegative()
                .optional(),

            categoryId:
                z.string()
                .uuid()
                .optional(),

            imageUrl:
                z.string()
                .url()
                .optional(),

            stock:
                z.coerce
                .number()
                .int()
                .nonnegative()
                .optional()
                .default(0),

            variants:
                z.array(

                z.object({

                    size:
                    z.string()
                        .min(1)
                        .max(50),

                    stock:
                    z.coerce
                        .number()
                        .int()
                        .nonnegative()

                })

                )
                .optional()

            });


        const d =
            schema.parse({

            ...req.body,

            variants

            });


        const normalizedVariants =
            d.variants?.length

            ? d.variants.map(
                (variant) => ({

                    size:
                    variant.size
                        .trim(),

                    stock:
                    Number(
                        variant.stock
                    )

                })
                )

            : [

                {

                    size:
                    'Free Size',

                    stock:
                    d.stock || 0

                }

                ];


        const sizeKeys =
            normalizedVariants.map(
            (variant) =>
                variant.size
                .toLowerCase()
            );


        if (
            new Set(sizeKeys).size !==
            sizeKeys.length
        ) {

            return res.status(400).json({

            message:
                'Each size can only be added once.'

            });

        }


        const productResult =
            await q(

            `

            INSERT INTO products(

                name,
                slug,
                description,
                brand,
                price,
                compare_at_price,
                category_id

            )

            VALUES(

                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7

            )

            RETURNING *

            `,

            [

                d.name,

                d.slug,

                d.description ||
                null,

                d.brand ||
                null,

                d.price,

                d.compareAtPrice ??
                null,

                d.categoryId ||
                null

            ]

            );


        const product =
            productResult.rows[0];


        if (d.imageUrl) {

            await q(

            `

            INSERT INTO product_images(

                product_id,
                image_url,
                alt_text,
                sort_order

            )

            VALUES(

                $1,
                $2,
                $3,
                $4

            )

            `,

            [

                product.id,

                d.imageUrl,

                d.name,

                0

            ]

            );

        }


        const uploadedFiles =
            Array.isArray(
            req.files
            )
            ? req.files
            : [];


        const imageStartOrder =
            d.imageUrl
            ? 1
            : 0;


        for (
            let index = 0;
            index < uploadedFiles.length;
            index += 1
        ) {

            const file =
            uploadedFiles[index];


            const imageUrl =
            `${req.protocol}://${req.get(
                'host'
            )}/uploads/products/${encodeURIComponent(
                file.filename
            )}`;


            await q(

            `

            INSERT INTO product_images(

                product_id,
                image_url,
                alt_text,
                sort_order

            )

            VALUES(

                $1,
                $2,
                $3,
                $4

            )

            `,

            [

                product.id,

                imageUrl,

                d.name,

                imageStartOrder +
                index

            ]

            );

        }


        for (
            let index = 0;
            index <
            normalizedVariants.length;
            index += 1
        ) {

            const variant =
            normalizedVariants[index];


            const skuSuffix =
            variant.size
                .toUpperCase()
                .replace(
                /[^A-Z0-9]+/g,
                '-'
                )
                .replace(
                /^-+|-+$/g,
                ''
                ) ||
            'SIZE';


            const sku =
            `SKU-${Date.now()}-${index + 1}-${skuSuffix}`;


            await q(

            `

            INSERT INTO product_variants(

                product_id,
                sku,
                size,
                stock

            )

            VALUES(

                $1,
                $2,
                $3,
                $4

            )

            `,

            [

                product.id,

                sku,

                variant.size,

                variant.stock

            ]

            );

        }


        res.status(201).json({

            message:
            'Product created successfully',

            product,

            uploadedImages:
            uploadedFiles.map(
                (file) =>
                `${req.protocol}://${req.get(
                    'host'
                )}/uploads/products/${encodeURIComponent(
                    file.filename
                )}`
            )

        });

        } catch (e) {

        console.error(
            'Create product error:',
            e
        );

        next(e);

        }

    }

    );


    /* =========================================================
    PRODUCT UPDATE
    ========================================================= */

    r.patch(
    '/products/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

        const allowed = [

            'name',
            'description',
            'brand',
            'price',
            'compare_at_price',
            'category_id',
            'status',
            'featured'

        ];


        const fields =
            Object.keys(
            req.body
            )
            .filter(
            (key) =>
                allowed.includes(
                key
                )
            );


        if (!fields.length) {

            return res.json({

            message:
                'No changes'

            });

        }


        const values =
            fields.map(
            (key) =>
                req.body[key]
            );


        const set =
            fields
            .map(
                (key, index) =>
                `${key}=$${index + 1}`
            )
            .join(',');


        values.push(
            req.params.id
        );


        await q(

            `

            UPDATE products

            SET
            ${set},
            updated_at=NOW()

            WHERE id=$${values.length}

            `,

            values

        );


        res.json({

            message:
            'Product updated'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    PRODUCT ARCHIVE
    ========================================================= */

    r.delete(
    '/products/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

        await q(

            `

            UPDATE products

            SET
            status='archived',
            updated_at=NOW()

            WHERE id=$1

            `,

            [
            req.params.id
            ]

        );


        res.json({

            message:
            'Product archived'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    CATEGORIES
    ========================================================= */

    r.get(
    '/categories',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT *

                FROM categories

                ORDER BY name

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    CREATE CATEGORY
    Supports category image upload
    ========================================================= */

    r.post(
    '/categories',

    uploadCategoryImage.single(
        'image'
    ),

    async (
        req,
        res,
        next
    ) => {

        try {

        const {
            name,
            slug,
            description,
            isActive,
            is_active,
            status
        } = req.body;


        if (
            !name?.trim()
        ) {

            return res.status(400).json({

            message:
                'Category name is required.'

            });

        }


        const normalizedSlug =
            (
            slug?.trim() ||
            name
                .trim()
                .toLowerCase()
            )
            .replace(
            /[^a-z0-9]+/g,
            '-'
            )
            .replace(
            /^-+|-+$/g,
            '');


        if (
            !normalizedSlug
        ) {

            return res.status(400).json({

            message:
                'A valid category slug is required.'

            });

        }


        const active =
            typeof isActive !==
            'undefined'

            ? String(
                isActive
                ) !== 'false'

            : typeof is_active !==
                'undefined'

                ? String(
                    is_active
                ) !== 'false'

                : status

                ? status !==
                    'inactive'

                : true;


        const imageUrl =
            req.file

            ? `${req.protocol}://${req.get(
                'host'
                )}/uploads/categories/${encodeURIComponent(
                req.file.filename
                )}`

            : null;


        const result =
            await q(

            `

            INSERT INTO categories(

                name,
                slug,
                description,
                is_active,
                image_url

            )

            VALUES(

                $1,
                $2,
                $3,
                $4,
                $5

            )

            RETURNING *

            `,

            [

                name.trim(),

                normalizedSlug,

                description?.trim() ||
                null,

                active,

                imageUrl

            ]

            );


        res.status(201).json(
            result.rows[0]
        );

        } catch (e) {

        console.error(
            'Create category error:',
            e
        );

        next(e);

        }

    }
    );


    /* =========================================================
    UPDATE CATEGORY
    Supports category image replacement
    ========================================================= */

    r.patch(
    '/categories/:id',

    uploadCategoryImage.single(
        'image'
    ),

    async (
        req,
        res,
        next
    ) => {

        try {

        const currentResult =
            await q(

            `

            SELECT *

            FROM categories

            WHERE id = $1

            `,

            [
                req.params.id
            ]

            );


        if (
            !currentResult.rowCount
        ) {

            return res.status(404).json({

            message:
                'Category not found.'

            });

        }


        const current =
            currentResult.rows[0];


        const name =
            req.body.name?.trim() ||
            current.name;


        const slug =
            (
            req.body.slug?.trim() ||
            current.slug
            )
            .toLowerCase()
            .replace(
            /[^a-z0-9]+/g,
            '-'
            )
            .replace(
            /^-+|-+$/g,
            '');


        const active =
            typeof req.body.isActive !==
            'undefined'

            ? String(
                req.body.isActive
                ) !== 'false'

            : typeof req.body.is_active !==
                'undefined'

                ? String(
                    req.body.is_active
                ) !== 'false'

                : typeof req.body.status !==
                'undefined'

                ? req.body.status !==
                    'inactive'

                : current.is_active;


        const imageUrl =
            req.file

            ? `${req.protocol}://${req.get(
                'host'
                )}/uploads/categories/${encodeURIComponent(
                req.file.filename
                )}`

            : current.image_url ||
                null;


        const result =
            await q(

            `

            UPDATE categories

            SET

                name = $1,

                slug = $2,

                description = $3,

                is_active = $4,

                image_url = $5,

                updated_at = NOW()

            WHERE id = $6

            RETURNING *

            `,

            [

                name,

                slug,

                typeof req.body.description !==
                'undefined'

                ? req.body.description
                    .trim() ||
                    null

                : current.description,

                active,

                imageUrl,

                req.params.id

            ]

            );


        res.json(
            result.rows[0]
        );

        } catch (e) {

        console.error(
            'Update category error:',
            e
        );

        next(e);

        }

    }
    );


    /* =========================================================
    DELETE / ARCHIVE CATEGORY
    ========================================================= */

    r.delete(
    '/categories/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

        await q(

            `

            UPDATE categories

            SET

            is_active = false,

            updated_at = NOW()

            WHERE id = $1

            `,

            [
            req.params.id
            ]

        );


        res.json({

            message:
            'Category archived'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    CUSTOMERS
    ========================================================= */

    r.get(
    '/customers',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                id,
                name,
                email,
                mobile,
                mobile_verified,
                status,
                created_at

                FROM users

                ORDER BY
                created_at DESC

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.patch(
    '/customers/:id/status',
    async (
        req,
        res,
        next
    ) => {

        try {

        await q(

            `

            UPDATE users

            SET

            status=$1,

            updated_at=NOW()

            WHERE id=$2

            `,

            [

            req.body.status,

            req.params.id

            ]

        );


        res.json({

            message:
            'Customer status updated'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    ORDERS
    ========================================================= */

    /*
     * GET /api/admin/orders
     *
     * Returns the order list used by the Admin Orders page.
     * Includes enough information for an admin to identify the
     * customer and shipment without opening the order.
     */
    r.get(
    '/orders',
    async (
        req,
        res,
        next
    ) => {

        try {

        const result = await q(`

            SELECT

                o.*,

                u.name AS customer_name,

                u.email AS customer_email,

                u.mobile AS customer_mobile,

                s.tracking_number,

                s.carrier,

                s.status AS shipment_status

            FROM orders o

            JOIN users u
            ON u.id = o.user_id

            LEFT JOIN shipments s
            ON s.order_id = o.id

            ORDER BY
                o.created_at DESC

        `);


        res.json(
            result.rows
        );

        } catch (e) {

        console.error(
            'Admin orders list error:',
            e
        );

        next(e);

        }

    }
    );


    /*
     * GET /api/admin/orders/:id
     *
     * Returns the complete order required for packing:
     *
     * - order information
     * - customer information
     * - shipping/billing address
     * - payment information
     * - shipment/tracking information
     * - order items
     *
     * The item-table lookup supports both:
     *   order_items
     *   orders_orderitem
     *
     * If neither table exists, the order is still returned with
     * an empty items array instead of crashing the admin page.
     */
    r.get(
    '/orders/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

        const orderResult = await q(`

            SELECT

                o.*,

                u.name AS customer_name,

                u.email AS customer_email,

                u.mobile AS customer_mobile,

                s.tracking_number,

                s.carrier,

                s.status AS shipment_status

            FROM orders o

            JOIN users u
            ON u.id = o.user_id

            LEFT JOIN shipments s
            ON s.order_id = o.id

            WHERE o.id = $1

            LIMIT 1

        `, [

            req.params.id

        ]);


        if (!orderResult.rowCount) {

            return res.status(404).json({

                message:
                    'Order not found.'

            });

        }


        const order =
            orderResult.rows[0];


        let items = [];

        let itemsTable = null;


        try {

            itemsTable =
                await findOrderItemsTable();


            if (itemsTable) {

                /*
                 * The table name comes only from the
                 * information_schema allow-list above.
                 * It is therefore safe to interpolate here.
                 */
                const itemsResult = await q(`

                    SELECT *

                    FROM "${itemsTable}"

                    WHERE order_id = $1

                    ORDER BY id ASC

                `, [

                    req.params.id

                ]);

                items =
                    itemsResult.rows;

            }

        } catch (itemError) {

            /*
             * Do not make the entire order page unusable
             * just because the item table is not present
             * in an older database.
             */
            console.error(
                'Admin order items lookup error:',
                itemError
            );

            items = [];

        }


        res.json({

            order: {

                ...order,

                /*
                 * Keep both names so the frontend can work with
                 * either the current schema or the design schema.
                 */
                order_number:
                    order.order_number ||
                    order.id,

                customer: {

                    name:
                        order.customer_name ||
                        '',

                    email:
                        order.customer_email ||
                        '',

                    mobile:
                        order.customer_mobile ||
                        order.mobile ||
                        ''

                },

                shipping_address:
                    order.shipping_address ||
                    null,

                billing_address:
                    order.billing_address ||
                    null,

                payment: {

                    method:
                        order.payment_method ||
                        '',

                    status:
                        order.payment_status ||
                        ''

                },

                shipment: {

                    tracking_number:
                        order.tracking_number ||
                        '',

                    carrier:
                        order.carrier ||
                        '',

                    status:
                        order.shipment_status ||
                        order.status ||
                        ''

                },

                items

            },

            items_table:
                itemsTable

        });

        } catch (e) {

        console.error(
            'Admin order details error:',
            e
        );

        next(e);

        }

    }
    );


    /*
     * PATCH /api/admin/orders/:id/status
     *
     * Updates fulfilment status and, when supplied, shipment
     * carrier/tracking information.
     */
    r.patch(
    '/orders/:id/status',
    async (
        req,
        res,
        next
    ) => {

        try {

        const status =
            normalizeOrderStatus(
                req.body.status
            );


        if (!status) {

            return res.status(400).json({

                message:
                    `Invalid order status. Allowed values: ${ORDER_STATUSES.join(', ')}`

            });

        }


        const orderResult =
            await q(`

                SELECT
                    id,
                    order_number,
                    status

                FROM orders

                WHERE id = $1

                LIMIT 1

            `, [

                req.params.id

            ]);


        if (!orderResult.rowCount) {

            return res.status(404).json({

                message:
                    'Order not found.'

            });

        }


        await q(

            `

            UPDATE orders

            SET

                status = $1,

                updated_at = NOW()

            WHERE id = $2

            `,

            [

                status,

                req.params.id

            ]

        );


        /*
         * Shipment information is optional. If the shipments row
         * already exists, update it. This keeps compatibility
         * with the current database design.
         */
        if (
            req.body.trackingNumber ||
            req.body.carrier ||
            status === 'shipped'
        ) {

            const shipmentResult =
                await q(`

                    SELECT id

                    FROM shipments

                    WHERE order_id = $1

                    LIMIT 1

                `, [

                    req.params.id

                ]);


            if (shipmentResult.rowCount) {

                await q(

                    `

                    UPDATE shipments

                    SET

                        tracking_number =
                        COALESCE(
                            $1,
                            tracking_number
                        ),

                        carrier =
                        COALESCE(
                            $2,
                            carrier
                        ),

                        status = $3,

                        updated_at = NOW()

                    WHERE order_id = $4

                    `,

                    [

                        req.body.trackingNumber ||
                            null,

                        req.body.carrier ||
                            null,

                        status,

                        req.params.id

                    ]

                );

            }

        }


        res.json({

            message:
                'Order updated successfully.',

            orderId:
                req.params.id,

            status

        });

        } catch (e) {

        console.error(
            'Admin order status update error:',
            e
        );

        next(e);

        }

    }
    );


    /* =========================================================
    PAYMENTS
    ========================================================= */

    r.get(
    '/payments',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                p.*,

                o.order_number,

                u.name AS customer_name

                FROM payments p

                JOIN orders o
                ON o.id = p.order_id

                JOIN users u
                ON u.id = o.user_id

                ORDER BY
                p.created_at DESC

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /*
     * GET /api/admin/payments/:id
     *
     * Returns complete payment information for the admin payment
     * detail screen, including the related order and customer.
     *
     * The payment table is returned with p.* so this endpoint remains
     * compatible with the current payment schema without assuming
     * optional gateway-specific columns such as transaction_id.
     */
    r.get(
    '/payments/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

            const result = await q(`

                SELECT

                    p.*,

                    o.order_number,
                    o.total AS order_total,
                    o.status AS order_status,
                    o.payment_status AS order_payment_status,
                    o.payment_method AS order_payment_method,
                    o.shipping_address,
                    o.billing_address,
                    o.created_at AS order_created_at,
                    o.updated_at AS order_updated_at,

                    u.id AS customer_id,
                    u.name AS customer_name,
                    u.email AS customer_email,
                    u.mobile AS customer_mobile

                FROM payments p

                JOIN orders o
                    ON o.id = p.order_id

                JOIN users u
                    ON u.id = o.user_id

                WHERE p.id = $1

                LIMIT 1

            `, [
                req.params.id
            ]);

            if (!result.rowCount) {

                return res.status(404).json({

                    message:
                        'Payment not found.'

                });

            }

            const row = result.rows[0];

            /*
             * Keep the original payment columns at the top level and
             * additionally expose order/customer objects for the
             * payment detail screen.
             */
            res.json({

                payment: {

                    ...row,

                    order: {

                        id:
                            row.order_id || '',

                        order_number:
                            row.order_number ||
                            row.order_id ||
                            '',

                        total:
                            row.order_total ?? null,

                        status:
                            row.order_status ||
                            '',

                        payment_status:
                            row.order_payment_status ||
                            '',

                        payment_method:
                            row.order_payment_method ||
                            '',

                        shipping_address:
                            row.shipping_address ||
                            null,

                        billing_address:
                            row.billing_address ||
                            null,

                        created_at:
                            row.order_created_at ||
                            null,

                        updated_at:
                            row.order_updated_at ||
                            null

                    },

                    customer: {

                        id:
                            row.customer_id ||
                            '',

                        name:
                            row.customer_name ||
                            '',

                        email:
                            row.customer_email ||
                            '',

                        mobile:
                            row.customer_mobile ||
                            ''

                    },

                    /*
                     * Flat aliases keep compatibility with the existing
                     * Admin.jsx payment helper functions.
                     */
                    customer_name:
                        row.customer_name ||
                        '',

                    customer_email:
                        row.customer_email ||
                        '',

                    customer_mobile:
                        row.customer_mobile ||
                        '',

                    shipping_address:
                        row.shipping_address ||
                        null,

                    billing_address:
                        row.billing_address ||
                        null

                }

            });

        } catch (e) {

            console.error(
                'Admin payment details error:',
                e
            );

            next(e);

        }

    }
    );


    /* =========================================================
    COUPONS
    ========================================================= */

    r.get(
    '/coupons',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT *

                FROM coupons

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.post(
    '/coupons',
    async (
        req,
        res,
        next
    ) => {

        try {

        const {

            code,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            expiresAt

        } = req.body;


        res.status(201).json(

            (

            await q(

                `

                INSERT INTO coupons(

                code,
                description,
                discount_type,
                discount_value,
                min_order_value,
                max_discount,
                expires_at

                )

                VALUES(

                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7

                )

                RETURNING *

                `,

                [

                code,

                description ||
                    null,

                discountType,

                discountValue,

                minOrderValue ||
                    0,

                maxDiscount ||
                    null,

                expiresAt ||
                    null

                ]

            )

            ).rows[0]

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    REVIEWS
    ========================================================= */

    r.get(
    '/reviews',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                r.*,

                u.name AS user_name,

                p.name AS product_name

                FROM reviews r

                JOIN users u
                ON u.id = r.user_id

                JOIN products p
                ON p.id = r.product_id

                ORDER BY
                r.created_at DESC

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.patch(
    '/reviews/:id/status',
    async (
        req,
        res,
        next
    ) => {

        try {

        await q(

            `

            UPDATE reviews

            SET

            status=$1

            WHERE id=$2

            `,

            [

            req.body.status,

            req.params.id

            ]

        );


        res.json({

            message:
            'Review updated'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    BANNERS
    ========================================================= */

    r.get(
    '/banners',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT *

                FROM banners

                ORDER BY
                sort_order,
                created_at DESC

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.post(
    '/banners',
    async (
        req,
        res,
        next
    ) => {

        try {

        const {

            title,
            subtitle,
            imageUrl,
            ctaLabel,
            ctaUrl

        } = req.body;


        res.status(201).json(

            (

            await q(

                `

                INSERT INTO banners(

                title,
                subtitle,
                image_url,
                cta_label,
                cta_url

                )

                VALUES(

                $1,
                $2,
                $3,
                $4,
                $5

                )

                RETURNING *

                `,

                [

                title,

                subtitle ||
                    null,

                imageUrl ||
                    null,

                ctaLabel ||
                    null,

                ctaUrl ||
                    null

                ]

            )

            ).rows[0]

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    INVENTORY
    ========================================================= */

    r.get(
    '/inventory',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                v.*,

                p.name AS product_name

                FROM product_variants v

                JOIN products p
                ON p.id = v.product_id

                ORDER BY
                v.stock ASC

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.patch(
    '/inventory/:id',
    async (
        req,
        res,
        next
    ) => {

        try {

        await q(

            `

            UPDATE product_variants

            SET

            stock=$1

            WHERE id=$2

            `,

            [

            req.body.stock,

            req.params.id

            ]

        );


        res.json({

            message:
            'Inventory updated'

        });

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    ADMIN USERS
    ========================================================= */

    r.get(
    '/admins',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                id,
                name,
                email,
                role,
                status,
                last_login_at,
                created_at

                FROM admins

                ORDER BY
                created_at

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    r.post(
    '/admins',
    async (
        req,
        res,
        next
    ) => {

        try {

        const hash =
            await bcrypt.hash(
            req.body.password,
            12
            );


        res.status(201).json(

            (

            await q(

                `

                INSERT INTO admins(

                name,
                email,
                password_hash,
                role

                )

                VALUES(

                $1,
                $2,
                $3,
                $4

                )

                RETURNING

                id,
                name,
                email,
                role,
                status

                `,

                [

                req.body.name,

                req.body.email,

                hash,

                req.body.role ||
                    'admin'

                ]

            )

            ).rows[0]

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    AUDIT LOGS
    ========================================================= */

    r.get(
    '/audit-logs',
    async (
        req,
        res,
        next
    ) => {

        try {

        res.json(

            (

            await q(`

                SELECT

                al.*,

                a.name AS admin_name

                FROM audit_logs al

                LEFT JOIN admins a
                ON a.id = al.admin_id

                ORDER BY
                al.created_at DESC

                LIMIT 200

            `)

            ).rows

        );

        } catch (e) {

        next(e);

        }

    }
    );


    /* =========================================================
    EXPORT
    ========================================================= */

    export default r;