import { Fragment, useMemo, useState } from "react";

import {
  type CategoryKey,
  categories,
  toCategoryKey,
} from "../../../utils/categories";
import { classes } from "../../../utils/classes";

import { useProducts } from "../../../hooks/useProducts";

import { ProductCard } from "../../../components/ProductCard";

import Overlay from "./Overlay";

const PRODUCT_DATA_URL = "./products.json";

const tabClass =
  "border px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors";

export default function Products() {
  const { products, loading } = useProducts(PRODUCT_DATA_URL);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(
    categories[0].key,
  );

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => toCategoryKey(product.category) === activeCategory,
      ),
    [products, activeCategory],
  );

  if (loading) return null;

  return (
    <main className="relative flex max-h-full flex-col overflow-x-hidden overflow-y-auto bg-black px-2 pt-16 pb-4 md:px-4">
      <div className="absolute inset-x-0 top-0 h-12 w-screen bg-white" />

      <div className="sticky top-12 z-[5] -mx-2 mb-4 flex flex-wrap justify-center gap-2 bg-black px-2 py-2 md:-mx-4 md:px-4">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => {
              setActiveCategory(category.key);
              setActiveProductId(null);
            }}
            className={classes(
              tabClass,
              activeCategory === category.key
                ? "border-white bg-white text-black"
                : "border-white/40 bg-black text-white hover:border-white",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {visibleProducts.length === 0 ? (
        <p className="mt-8 text-center text-[10px] tracking-widest text-white/60 uppercase">
          Coming soon
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {visibleProducts.map((product) => (
            <Fragment key={product.id}>
              <Overlay
                show={activeProductId === String(product.id)}
                onClose={() => setActiveProductId(null)}
              >
                <div className="max-w-[90vw]">
                  <ProductCard product={product} />
                </div>
              </Overlay>

              <button
                onClick={() => setActiveProductId(String(product.id))}
                className={classes(
                  "group relative flex w-32 flex-col items-center gap-2 border border-white bg-black p-2 transition-all hover:bg-white md:w-48",
                )}
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-900">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-center text-[10px] font-bold tracking-widest text-white uppercase group-hover:text-black">
                  {product.name}
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </main>
  );
}
