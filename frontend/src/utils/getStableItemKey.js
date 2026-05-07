/**
 * Generate a stable, unique key for list items
 * Uses place_id/id as primary, with name+address as fallback
 */
export function getStableItemKey(item, index) {
  // Try to use stable IDs first
  if (item?.place_id) return `place_${item.place_id}`;
  if (item?.placeId) return `place_${item.placeId}`;
  if (item?.google_place_id) return `gid_${item.google_place_id}`;
  if (item?.googlePlaceId) return `gid_${item.googlePlaceId}`;
  if (item?._id) return `mid_${item._id}`;
  if (item?.id) return `id_${item.id}`;
  if (item?.reference) return `ref_${item.reference}`;
  
  // Fallback to name + address combo
  const name = (item?.name || item?.title || item?.display_name || '').trim().toLowerCase().replace(/\s+/g, '_');
  const address = (item?.address || item?.location || item?.area || item?.place || '').trim().toLowerCase().replace(/\s+/g, '_');
  
  if (name && address) {
    return `${name}__${address}`;
  }
  
  // Last resort: use index-based fallback
  return `item_${index}`;
}
