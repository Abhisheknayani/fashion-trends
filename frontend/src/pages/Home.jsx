import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  Heart,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

import { api, money } from '../services/api';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';


/* =========================================================
   PRODUCT CARD
========================================================= */

function Card({ p }) {

  const {
    addCart,
    toggleWish,
    wishlist
  } = useApp();

  const wished = wishlist?.some(
    x => x.product_id === p.id
  );

  const image =
    p.image_url ||
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80';

  return (
    <article className="product-card">

      <Link
        to={`/product/${p.slug}`}
        className="product-image"
      >

        <img
          src={image}
          alt={p.name}
          loading="lazy"
        />

        {p.compare_at_price && (
          <span className="discount">
            SALE
          </span>
        )}

      </Link>


      <div className="product-info">

        <div className="row">

          <span className="muted">
            {p.brand || 'Fashion Trends'}
          </span>

          <button
            type="button"
            className={
              wished
                ? 'heart active'
                : 'heart'
            }
            onClick={() => toggleWish(p.id)}
            aria-label="Add to wishlist"
          >

            <Heart
              size={19}
              fill={
                wished
                  ? 'currentColor'
                  : 'none'
              }
            />

          </button>

        </div>


        <Link
          to={`/product/${p.slug}`}
          className="product-name"
        >
          {p.name}
        </Link>


        <div className="price">

          <b>
            {money(p.price)}
          </b>

          {p.compare_at_price && (
            <del>
              {money(p.compare_at_price)}
            </del>
          )}

        </div>


        <button
          type="button"
          className="add-bag"
          onClick={() =>
            addCart(
              p.id,
              p.variants?.[0]?.id
            )
          }
        >

          Add to bag

          <ShoppingBag size={16} />

        </button>

      </div>

    </article>
  );
}


/* =========================================================
   HOMEPAGE
========================================================= */

export default function Home() {

  const [searchParams] = useSearchParams();

  /*
   * IMPORTANT:
   * Extract primitive values instead of using
   * the searchParams object itself as the dependency.
   */

  const category =
    searchParams.get('category') || '';

  const search =
    searchParams.get('q') || '';


  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  /* =====================================================
     LOAD CATEGORIES
  ===================================================== */

  useEffect(() => {

    api
      .get('/catalog/categories')
      .then(response => {

        const categoryData =
          Array.isArray(response.data)
            ? response.data
            : [];

        console.log(
          'Categories received:',
          categoryData
        );

        setCategories(categoryData);

      })
      .catch(error => {

        console.error(
          'Categories error:',
          error
        );

        setCategories([]);

      });

  }, []);


  /* =====================================================
     LOAD PRODUCTS

     THIS NOW RUNS WHEN:

     category changes
     OR
     search changes
  ===================================================== */

  useEffect(() => {

    let cancelled = false;

    async function loadProducts() {

      try {

        setLoading(true);
        setError('');

        const params = {};

        if (category) {
          params.category = category;
        }

        if (search) {
          params.q = search;
        }

        console.log(
          'Loading products with:',
          params
        );


        const response =
          await api.get(
            '/catalog/products',
            { params }
          );


        if (!cancelled) {

          console.log(
            'Products received:',
            response.data
          );

          setProducts(
            Array.isArray(response.data)
              ? response.data
              : []
          );

        }

      } catch (error) {

        console.error(
          'Products API error:',
          error
        );

        if (!cancelled) {

          setError(
            error?.response?.data?.message ||
            'Unable to load products.'
          );

          setProducts([]);

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadProducts();


    return () => {
      cancelled = true;
    };

  }, [category, search]);


  /* =====================================================
     CATEGORY NAME
  ===================================================== */

  const selectedCategory =
    categories.find(
      c => c.slug === category
    );


  /* =====================================================
     CATEGORY PAGE
  ===================================================== */

  if (category) {

    const categoryName =
      selectedCategory?.name ||
      category;

    const categoryImage =
      selectedCategory?.image_url || '';


    return (

      <div className="section category-page">

        {/* =================================================
            CATEGORY IMAGE HERO

            Only shown when the selected category has
            an uploaded image.
        ================================================= */}

        {categoryImage && (

          <div
            className="category-detail-hero"
            style={{
              position: 'relative',
              width: '100%',
              height: '360px',
              marginBottom: '30px',
              overflow: 'hidden',
              borderRadius: '6px',
              background: '#f5f5f5'
            }}
          >

            {/* COMPLETE CATEGORY IMAGE */}

            <img
              src={categoryImage}
              alt={categoryName}
              className="category-detail-image"
              loading="eager"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                background: '#f5f5f5',
                zIndex: 0
              }}
              onError={(event) => {

                console.error(
                  'Category detail image failed to load:',
                  categoryImage
                );

                event.currentTarget.style.display =
                  'none';

              }}
            />


            {/* DARK OVERLAY */}

            <div
              className="category-detail-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                pointerEvents: 'none',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.03) 82%, transparent)'
              }}
            />


            {/* CATEGORY INFORMATION */}

            <div
              className="category-detail-content"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                padding: '35px'
              }}
            >

              <span
                className="eyebrow"
                style={{
                  color: '#ffffff',
                  marginBottom: '8px'
                }}
              >
                FASHION TRENDS
              </span>


              <h1
                style={{
                  margin: '0 0 8px',
                  color: '#ffffff',
                  fontSize: '38px',
                  fontWeight: '800',
                  lineHeight: '1.1',
                  textShadow:
                    '0 2px 5px rgba(0,0,0,0.5)'
                }}
              >
                {categoryName}
              </h1>


              <p
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  textShadow:
                    '0 1px 3px rgba(0,0,0,0.5)'
                }}
              >

                {loading
                  ? 'Loading products...'
                  : `${products.length} product${
                      products.length === 1
                        ? ''
                        : 's'
                    } available`
                }

              </p>

            </div>

          </div>

        )}


        {/* =================================================
            CATEGORY HEADER

            If there is no uploaded image, show the
            normal text header.
        ================================================= */}

        {!categoryImage && (

          <div className="section-head">

            <div>

              <span className="eyebrow">
                FASHION TRENDS
              </span>

              <h1>
                {categoryName}
              </h1>

              <p className="muted">

                {loading
                  ? 'Loading products...'
                  : `${products.length} product${
                      products.length === 1
                        ? ''
                        : 's'
                    } available`
                }

              </p>

            </div>


            <div className="category-actions">

              <button
                type="button"
                className="filter-button"
              >

                <SlidersHorizontal
                  size={17}
                />

                Filters

              </button>

            </div>

          </div>

        )}


        {/* =================================================
            CATEGORY NAVIGATION
        ================================================= */}

        <div
          className="category-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '30px',
            paddingBottom: '5px'
          }}
        >

          {categories.map(c => (

            <Link
              key={c.id}
              to={`/?category=${c.slug}`}
              className={
                c.slug === category
                  ? 'category-tab active'
                  : 'category-tab'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '38px',
                padding: '8px 16px',
                border:
                  c.slug === category
                    ? '1px solid #ff3f6c'
                    : '1px solid #e5e5e5',
                borderRadius: '4px',
                background:
                  c.slug === category
                    ? '#ff3f6c'
                    : '#ffffff',
                color:
                  c.slug === category
                    ? '#ffffff'
                    : '#282c3f',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                textDecoration: 'none'
              }}
            >
              {c.name}
            </Link>

          ))}

        </div>


        {/* =================================================
            SEARCH RESULT
        ================================================= */}

        {search && (

          <div className="search-result-info">

            Search results for:

            <strong>
              {' '}
              "{search}"
            </strong>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="error-state">

            {error}

          </div>

        )}


        {/* =================================================
            PRODUCTS
        ================================================= */}

        {loading ? (

          <div className="skeleton-grid">

            {[1, 2, 3, 4, 5, 6].map(
              number => (

                <div
                  className="skeleton"
                  key={number}
                />

              )
            )}

          </div>

        ) : products.length > 0 ? (

          <div className="product-grid">

            {products.map(product => (

              <Card
                key={product.id}
                p={product}
              />

            ))}

          </div>

        ) : (

          <EmptyState
            title="No products found"
            message={`There are currently no products in ${
              categoryName
            }.`}
            action={() => {
              window.location.href = '/';
            }}
          />

        )}

      </div>

    );

  }


  /* =====================================================
     SEARCH PAGE WITHOUT CATEGORY
  ===================================================== */

  if (search) {

    return (

      <div className="section">

        <div className="section-head">

          <div>

            <span className="eyebrow">
              SEARCH
            </span>

            <h1>
              Search results
            </h1>

            <p className="muted">
              Results for "{search}"
            </p>

          </div>

        </div>


        {loading ? (

          <div className="skeleton-grid">

            {[1, 2, 3, 4, 5, 6].map(
              number => (

                <div
                  className="skeleton"
                  key={number}
                />

              )
            )}

          </div>

        ) : products.length > 0 ? (

          <div className="product-grid">

            {products.map(product => (

              <Card
                key={product.id}
                p={product}
              />

            ))}

          </div>

        ) : (

          <EmptyState
            title="No products found"
            message="Try another product or brand."
            action={() => {
              window.location.href = '/';
            }}
          />

        )}

      </div>

    );

  }


  /* =====================================================
     NORMAL HOMEPAGE
  ===================================================== */

  return (

    <div>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">

        <div className="hero-copy">

          <span className="eyebrow">
            NEW SEASON / 2026
          </span>

          <h1>
            Style that moves
            <br />
            <i>with you.</i>
          </h1>

          <p>
            Curated essentials, statement
            pieces and everyday comfort—
            designed for your next chapter.
          </p>

          <Link
            to="/?category=women"
            className="btn btn-light"
          >

            Explore collection

            <ArrowRight size={18} />

          </Link>

        </div>


        <div className="hero-image">

          <img
            src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85"
            alt="Fashion collection"
          />

        </div>

      </section>


      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section className="section">

        <div className="section-head">

          <div>

            <span className="eyebrow">
              SHOP BY EDIT
            </span>

            <h2>
              Find your everyday
            </h2>

          </div>

          <Link
            to="/"
            className="text-link"
          >

            View all

            <ArrowRight size={16} />

          </Link>

        </div>


        <div className="category-grid">

          {categories.map(category => (

            <Link
              key={category.id}
              to={`/?category=${category.slug}`}
              className="category-tile"
              style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'flex-end',
                background: '#f5f5f5',
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >

              {/* =================================================
                  CATEGORY IMAGE

                  objectFit: contain keeps the complete image
                  visible without cropping.
              ================================================= */}

              {category.image_url ? (

                <img
                  src={category.image_url}
                  alt={
                    category.name ||
                    'Category'
                  }
                  className="category-image"
                  loading="lazy"

                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block',
                    zIndex: 0,
                    backgroundColor: '#f5f5f5'
                  }}

                  onError={(event) => {

                    console.error(
                      'Category image failed to load:',
                      category.image_url
                    );

                    event.currentTarget.style.display =
                      'none';

                  }}

                />

              ) : (

                <div
                  className="category-bg"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0
                  }}
                />

              )}


              {/* =================================================
                  DARK OVERLAY
              ================================================= */}

              <div
                className="category-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.20) 55%, rgba(0,0,0,0.02) 80%, transparent)'
                }}
              />


              {/* =================================================
                  CATEGORY NAME
              ================================================= */}

              <span
                className="category-name"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'block',
                  width: '100%',
                  padding: '20px',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '800',
                  lineHeight: '1.2',
                  textShadow:
                    '0 1px 4px rgba(0,0,0,0.7)',
                  boxSizing: 'border-box'
                }}
              >

                {category.name ||
                  'Category'}

              </span>

            </Link>

          ))}

        </div>

      </section>


      {/* =================================================
          TRENDING PRODUCTS
      ================================================= */}

      <section className="section">

        <div className="section-head">

          <div>

            <span className="eyebrow">
              CURATED FOR YOU
            </span>

            <h2>
              Trending now
            </h2>

          </div>

        </div>


        {loading ? (

          <div className="skeleton-grid">

            {[1, 2, 3, 4].map(
              number => (

                <div
                  className="skeleton"
                  key={number}
                />

              )
            )}

          </div>

        ) : products.length > 0 ? (

          <div className="product-grid">

            {products
              .slice(0, 8)
              .map(product => (

                <Card
                  key={product.id}
                  p={product}
                />

              ))}

          </div>

        ) : (

          <EmptyState
            title="No products found"
            message="Add products from the admin panel."
          />

        )}

      </section>

    </div>

  );

}