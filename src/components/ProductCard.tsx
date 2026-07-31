import React from "react";

import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group flex flex-col border border-white/20 bg-surface p-4 text-accent transition-all hover:bg-accent hover:text-surface">
      <div className="mb-4 aspect-square w-full overflow-hidden bg-gray-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-all"
        />
      </div>
      <p className="text-xs tracking-widest text-gray-300 uppercase group-hover:text-gray-300">
        {product.category}
      </p>
      <h3 className="mt-1 text-lg leading-tight font-black uppercase">
        {product.name}
      </h3>
      <p className="mt-2 font-mono text-sm">{product.price}</p>
      <a
        href={product.buy_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block border border-white bg-white py-2 text-center text-xs font-black tracking-widest text-surface uppercase transition-colors group-hover:border-accent-strong group-hover:bg-accent-strong group-hover:text-white"
      >
        Shop Now
      </a>
    </div>
  );
};
