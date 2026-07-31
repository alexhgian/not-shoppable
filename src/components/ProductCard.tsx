import React from "react";

import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="group flex flex-col border border-white/20 bg-[#454bc5] p-4 text-[#34d5a3] transition-all hover:bg-[#34d5a3] hover:text-[#454bc5]">
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
        className="mt-4 block border border-[#ffffff] bg-[#ffffff] py-2 text-center text-xs font-black tracking-widest text-[#454bc5] uppercase transition-colors group-hover:border-[#9625e9] group-hover:bg-[#9625e9] group-hover:text-white"
      >
        Shop Now
      </a>
    </div>
  );
};
