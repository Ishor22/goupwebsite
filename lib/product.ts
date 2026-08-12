// Next.js Route Handlers only allow exporting HTTP method handlers and a
// small set of config values, so this shared helper lives here instead of
// being exported from a route.ts file.
//
// Also converts Date fields to ISO strings: that's what they actually
// become once serialized across the Server Component -> Client Component
// boundary, so doing it explicitly here keeps the TypeScript types honest
// instead of relying on an implicit runtime conversion.
export function serializeProduct<
  T extends {
    price: { toString(): string };
    createdAt?: Date;
    updatedAt?: Date;
  },
>(
  product: T,
): Omit<T, 'price' | 'createdAt' | 'updatedAt'> & {
  price: number;
  createdAt: T['createdAt'] extends Date ? string : undefined;
  updatedAt: T['updatedAt'] extends Date ? string : undefined;
} {
  return {
    ...product,
    price: Number(product.price.toString()),
    createdAt: (product.createdAt ? product.createdAt.toISOString() : undefined) as any,
    updatedAt: (product.updatedAt ? product.updatedAt.toISOString() : undefined) as any,
  };
}
