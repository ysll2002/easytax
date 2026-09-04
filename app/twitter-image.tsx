// Twitter/X uses the same card as Open Graph. Re-exporting keeps one design
// rather than letting the two drift, and means twitter.images no longer points
// at the missing /og-image.png either.
export { default, alt, size, contentType } from './opengraph-image';
