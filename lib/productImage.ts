// Product pictures are stored directly in Postgres (Neon) as a data: URI
// inside the Product row's imageUrl column, rather than in a separate
// object-storage service. Encoding happens entirely in memory -- the file
// never touches disk -- so there is nothing external to clean up: the
// picture lives and dies with the product row it belongs to.
export async function encodeProductImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString('base64')}`;
}
