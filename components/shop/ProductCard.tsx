import CardAddToCartButton from './CardAddToCartButton';

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  videoUrl?: string | null;
  brother: { name: string };
};

// The one product-card design used everywhere a product is shown as a
// clickable tile: homepage Recent Products, the /products marketplace,
// and the product detail page's "You May Also Like" / "Recent Products"
// sections. `showAddToCart` is the only thing that varies by context.
export default function ProductCard({
  product,
  showAddToCart = false,
}: {
  product: ProductCardData;
  showAddToCart?: boolean;
}) {
  return (
    <div className="product-card-wrap">
      <a href={`/products/${product.id}`} className="product-card">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="product-card-image" loading="lazy" />
        ) : (
          <div className="product-card-image product-card-image-placeholder" aria-hidden="true" />
        )}
        <div className="product-card-body">
          <p className="product-card-name">{product.name}</p>
          <p className="product-card-price">AED {product.price.toFixed(2)}</p>
          <p className="product-card-brother">Published by: {product.brother.name}</p>
          {product.videoUrl && <span className="product-card-video-badge">Watch Video</span>}
        </div>
      </a>
      {showAddToCart && (
        <div className="product-card-cart-row">
          <CardAddToCartButton productId={product.id} />
        </div>
      )}
    </div>
  );
}
