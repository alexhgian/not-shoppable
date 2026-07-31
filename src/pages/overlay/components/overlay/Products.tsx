import { Transition } from "@headlessui/react";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { type CategoryKey, toCategoryKey } from "../../../../utils/categories";
import { classes } from "../../../../utils/classes";

import { useProducts } from "../../../../hooks/useProducts";

import { ProductCard } from "../../../../components/ProductCard";

import IconChevron from "../../../../components/icons/IconChevron";

import type { OverlayOptionProps } from "./Overlay";

const PRODUCT_DATA_URL = "./products.json";

const arrowClass =
  "absolute border-0 cursor-pointer text-white w-full h-[var(--list-fade-padding)] z-20 transition-opacity group pt-[var(--twitch-vertical-padding)] pb-4 box-content";
const arrowSvgClass =
  "mx-auto drop-shadow-lg overflow-visible transition-transform group-hover:scale-125 group-focus:scale-125";
const arrowPathClass =
  "[&_path]:stroke-neutral [&_path]:stroke-[0.25rem] [&_path]:[paint-order:stroke] [&_path]:transition-[stroke] [&_path]:group-hover:stroke-highlight [&_path]:group-hover:stroke-[0.375rem] [&_path]:group-focus:stroke-highlight [&_path]:group-focus:stroke-[0.375rem]";
const hiddenClass = "opacity-0 pointer-events-none";

type ProductsProps = OverlayOptionProps & { category?: CategoryKey };
const activeIdClass = "bg-white text-black font-bold";

export default function Products(props: ProductsProps) {
  const { className, context, category } = props;
  const { activeProduct, setActiveProduct } = context;
  const { products: allProducts, loading } = useProducts(PRODUCT_DATA_URL);

  const products = useMemo(() => {
    if (!category) return allProducts;
    return allProducts.filter(
      (product) => toCategoryKey(product.category) === category,
    );
  }, [allProducts, category]);

  const activeProductId = activeProduct.key || null;

  const upArrowRef = useRef<HTMLButtonElement>(null);
  const productList = useRef<HTMLDivElement>(null);
  const downArrowRef = useRef<HTMLButtonElement>(null);

  // Scroll the product list to the selected product
  useEffect(() => {
    if (!productList.current || !activeProductId) return;

    const offset = 200;
    const anchorElement = productList.current.querySelector(
      `#product-${activeProductId}`,
    );
    if (anchorElement instanceof HTMLButtonElement)
      productList.current.scrollTo({
        top: Math.max(0, anchorElement.offsetTop - offset),
        behavior: "smooth",
      });
  }, [activeProductId]);

  // Allow the list to be scrolled via the buttons
  const productListScroll = useCallback(
    (event: MouseEvent, direction: number) => {
      if (productList.current) {
        event.stopPropagation();

        productList.current.scroll({
          top: productList.current.scrollTop - direction,
          left: 0,
          behavior: "smooth",
        });
      }
    },
    [],
  );

  // Ensure the buttons are only shown if the list is scrollable
  const handleArrowVisibility = useCallback(() => {
    const list = productList.current;
    if (!list) return;

    const listRect = list.getBoundingClientRect();
    const firstRect = list.firstElementChild?.getBoundingClientRect();
    const lastRect = list.lastElementChild?.getBoundingClientRect();
    if (!firstRect || !lastRect) return;

    // If more than 50% of the first element is hidden, show the up arrow
    for (const className of hiddenClass.split(" "))
      upArrowRef.current?.classList.toggle(
        className,
        firstRect.top >= listRect.top + firstRect.height / 2,
      );

    // If more than 50% of the last element is hidden, show the down arrow
    for (const className of hiddenClass.split(" "))
      downArrowRef.current?.classList.toggle(
        className,
        lastRect.bottom <= listRect.bottom - lastRect.height / 2,
      );
  }, []);

  // Check the arrow visibility on mount, as browsers restore odd scroll positions
  // Also, check it whenever the product list changes as the list may change size
  useEffect(() => {
    handleArrowVisibility();

    // If the window is resized, check the arrow visibility again
    window.addEventListener("resize", handleArrowVisibility);
    return () => window.removeEventListener("resize", handleArrowVisibility);
  }, [handleArrowVisibility, products]);

  if (loading) return <></>;

  return (
    <div
      className={classes(
        "grid-cols-auto-2 absolute top-0 left-0 z-0 grid h-full grid-rows-1",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div
          ref={productList}
          className="list-fade -my-[var(--twitch-vertical-padding)] scrollbar-none flex w-48 flex-col items-center gap-4 overflow-scroll px-4 py-[calc(var(--twitch-vertical-padding)+var(--list-fade-padding))]"
          onScroll={handleArrowVisibility}
        >
          {products.length === 0 && (
            <p className="w-full border border-white bg-black p-3 text-center text-[10px] leading-relaxed tracking-widest text-white uppercase">
              Coming soon
            </p>
          )}

          {products.map((product) => (
            <button
              id={`product-${product.id}`}
              key={product.id}
              onClick={() =>
                setActiveProduct((prev) =>
                  prev.key === String(product.id)
                    ? {}
                    : { key: String(product.id) },
                )
              }
              className={classes(
                "flex w-full items-center gap-2 border border-white p-2 text-xs tracking-tighter uppercase transition-colors hover:bg-white hover:text-black",
                activeProductId === String(product.id)
                  ? activeIdClass
                  : "bg-black text-white",
              )}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 object-contain"
                />
              )}
              <span className="flex-1 text-left">{product.name}</span>
            </button>
          ))}
        </div>

        <button
          ref={upArrowRef}
          className={classes(
            arrowClass,
            "-top-[var(--twitch-vertical-padding)]",
            hiddenClass,
          )}
          onClick={(e) => productListScroll(e, 250)}
          title="Scroll up"
          type="button"
          data-transparent-clicks
        >
          <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
        </button>

        <button
          ref={downArrowRef}
          className={classes(
            arrowClass,
            "-bottom-[var(--twitch-vertical-padding)] rotate-180",
          )}
          onClick={(e) => productListScroll(e, -250)}
          title="Scroll down"
          type="button"
          data-transparent-clicks
        >
          <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
        </button>
      </div>

      {products.map((product) => (
        <Transition
          show={activeProductId === String(product.id)}
          key={product.id}
        >
          <div className="z-0 col-start-2 row-start-1 flex max-h-full max-w-[300px] origin-[center_left] self-center transition-[opacity,transform,translate] will-change-[opacity,transform,translate] data-[closed]:-translate-x-10 data-[closed]:opacity-0 data-[closed]:motion-reduce:translate-x-0">
            <div className="p-4">
              <ProductCard product={product} />
            </div>
          </div>
        </Transition>
      ))}
    </div>
  );
}
