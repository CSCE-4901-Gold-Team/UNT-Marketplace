import { ListingStatusType } from "@/constants/ListingStatus";

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  isProfessorOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
  listingStatus: ListingStatusType;

  owner: {
    id: string;
    name: string;
    email: string;
  };
  images?: {
    id: number;
    url: string;
    sortOrder: number;
  }[];
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

export const LISTING_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "DRAFT", label: "Draft" },
] as const;