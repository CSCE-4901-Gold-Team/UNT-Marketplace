export const LISTING_STATUS = {
  AVAILABLE: 'AVAILABLE',
  DRAFT: 'DRAFT',
  SOLD: 'SOLD',
  ARCHIVED: 'ARCHIVED',
} as const;

export const LISTING_STATUS_LABELS = {
  AVAILABLE: 'Available',
  DRAFT: 'Draft',
  SOLD: 'Sold',
  ARCHIVED: 'Archived',
} as const;

export type ListingStatusType = (typeof LISTING_STATUS)[keyof typeof LISTING_STATUS];
