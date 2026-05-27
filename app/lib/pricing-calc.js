// Mirror of backend lib/pricing-calc.js — keep in sync manually.

export const PLATFORM_FEE = 99
export const CONVENIENCE_FEE = 27
export const GST_RATE = 0.18

export function setupTransportFee(basePrice) {
  const p = Number(basePrice) || 0
  if (p <= 10000) return 625
  if (p <= 20000) return 1025
  return 1325
}

export function customerBreakdown(basePrice) {
  const decoration = Math.round(Number(basePrice) || 0)
  const setupTransport = setupTransportFee(decoration)
  const feesSubtotal = setupTransport + PLATFORM_FEE + CONVENIENCE_FEE
  const subtotal     = decoration + feesSubtotal
  const gst          = Math.round(subtotal * GST_RATE)
  const total        = subtotal + gst
  return {
    decoration_total: decoration,
    setup_transport:  setupTransport,
    platform_fee:     PLATFORM_FEE,
    convenience_fee:  CONVENIENCE_FEE,
    fees_subtotal:    feesSubtotal,
    subtotal,
    gst,
    gst_rate:         GST_RATE,
    total,
  }
}

export function adminMargin(basePrice, itemsCostTotal) {
  const decoration = Math.round(Number(basePrice) || 0)
  const itemsCost  = Math.round((Number(itemsCostTotal) || 0) * 100) / 100
  const margin     = decoration - itemsCost
  const pct        = decoration > 0 ? (margin / decoration) * 100 : 0
  return {
    items_cost:       itemsCost,
    decoration_total: decoration,
    operating_margin: Math.round(margin * 100) / 100,
    margin_percent:   Math.round(pct * 10) / 10,
  }
}
