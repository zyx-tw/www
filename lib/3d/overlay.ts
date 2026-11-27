/**
 * Marks a mesh the path tracer leaves out and draws over its frame instead,
 * like the floor shadow, which only makes sense as a raster overlay. Kept
 * apart from the tracer so marking a mesh doesn't load it.
 */
export const OVERLAY = "pathTracerOverlay"
