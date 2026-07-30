import React from 'react';
import { classes } from '../utils/classes';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

const PRODUCT_DATA_URL = './products.json';

export const ProductGrid: React.FC = () => {
  const { products, loading, error } = useProducts(PRODUCT_DATA_URL);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="animate-pulse font-mono text-[10px] uppercase tracking-[0.3em] text-black">
          Loading Collection...
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center font-mono text-xs uppercase text-red-500">Error loading products.</div>;
  }

  return (
    <div className="min-h-screen bg-[#2b2f6a] p-6 text-black">
      <header className="mb-10 border-b-2 border-black pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter">e.l.f. Cosmetics</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">Twitch Exclusive Showcase</p>
      </header>
      
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};