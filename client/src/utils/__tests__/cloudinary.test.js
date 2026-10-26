import { describe, it, expect } from 'vitest';
import { transformReceiptThumbnail, transformReceiptLightbox } from '../cloudinary.js';

describe('Cloudinary URL Transformations', () => {
  const rawUrl = 'https://res.cloudinary.com/test-cloud/image/upload/expenseflow/groups/grp_1/receipts/rec_1.jpg';
  const versionedUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg';
  const transformedUrl = 'https://res.cloudinary.com/test-cloud/image/upload/w_200,h_200,c_fill/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg';
  const nonCloudinaryUrl = 'https://images.unsplash.com/photo-12345';
  const malformedUrl = 'not-a-valid-url';

  describe('transformReceiptThumbnail', () => {
    it('handles null and empty input safely', () => {
      expect(transformReceiptThumbnail(null)).toBeNull();
      expect(transformReceiptThumbnail(undefined)).toBeUndefined();
      expect(transformReceiptThumbnail('')).toBe('');
    });

    it('returns non-Cloudinary URLs unchanged', () => {
      expect(transformReceiptThumbnail(nonCloudinaryUrl)).toBe(nonCloudinaryUrl);
    });

    it('returns malformed URLs unchanged without throwing', () => {
      expect(transformReceiptThumbnail(malformedUrl)).toBe(malformedUrl);
    });

    it('transforms an unversioned Cloudinary URL with thumbnail parameters', () => {
      const result = transformReceiptThumbnail(rawUrl);
      expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_64,h_64,c_fill,f_auto,q_auto/expenseflow/groups/grp_1/receipts/rec_1.jpg');
    });

    it('transforms a versioned Cloudinary URL with thumbnail parameters before the version', () => {
      const result = transformReceiptThumbnail(versionedUrl);
      expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_64,h_64,c_fill,f_auto,q_auto/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg');
    });

    it('replaces existing transformations rather than stacking them', () => {
      const result = transformReceiptThumbnail(transformedUrl);
      expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_64,h_64,c_fill,f_auto,q_auto/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg');
    });
  });

  describe('transformReceiptLightbox', () => {
    it('handles null and empty input safely', () => {
      expect(transformReceiptLightbox(null)).toBeNull();
      expect(transformReceiptLightbox(undefined)).toBeUndefined();
    });

    it('transforms versioned Cloudinary URL with lightbox parameters', () => {
      const result = transformReceiptLightbox(versionedUrl);
      expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_1200,f_auto,q_auto/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg');
    });

    it('replaces existing transformations with lightbox parameters', () => {
      const result = transformReceiptLightbox(transformedUrl);
      expect(result).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_1200,f_auto,q_auto/v1720000000/expenseflow/groups/grp_1/receipts/rec_1.jpg');
    });
  });
});
