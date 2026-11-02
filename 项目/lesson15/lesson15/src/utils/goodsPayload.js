export const editableFields = ['goodsname', 'price', 'stock', 'img', 'c_id', 'introduce', 'is_sale']

export function buildGoodsUpdate(current, original) {
  const fields = editableFields.filter(key => current[key] !== original[key])
  if (!fields.length) return null
  const payload = Object.fromEntries(fields.map(key => [key, current[key]]))
  payload.g_id = current.g_id
  if (fields.includes('stock')) payload.version = original.version
  return payload
}
