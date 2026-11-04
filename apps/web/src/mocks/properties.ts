import type { ListingStatus, ListingType, Property, PropertyType } from '@/types';
import { daysAgo, ORG_ID } from './helpers';

type Row = [string, PropertyType, ListingType, number, string, string, number | undefined, number | undefined, number, Property['areaUnit'], ListingStatus, string];

const rows: Row[] = [
  ['Harbor View Loft', 'APARTMENT', 'SALE', 485000, 'Seattle', 'Waterfront', 2, 2, 1150, 'SQFT', 'AVAILABLE', 'usr_002'],
  ['Cedar Court Office Suite', 'OFFICE', 'RENT', 4200, 'Seattle', 'Downtown', undefined, 1, 2400, 'SQFT', 'AVAILABLE', 'usr_004'],
  ['Maple Grove Villa', 'HOUSE', 'SALE', 925000, 'Bellevue', 'Maple Grove', 5, 4, 3800, 'SQFT', 'RESERVED', 'usr_003'],
  ['Lakeside Plot 12', 'PLOT', 'SALE', 210000, 'Kirkland', 'Lakeside', undefined, undefined, 0.5, 'ACRE', 'AVAILABLE', 'usr_001'],
  ['Northgate Retail Unit', 'COMMERCIAL', 'RENT', 6800, 'Seattle', 'Northgate', undefined, 2, 1800, 'SQFT', 'AVAILABLE', 'usr_004'],
  ['Willow Creek Farmhouse', 'FARMHOUSE', 'SALE', 640000, 'Issaquah', 'Willow Creek', 4, 3, 2.5, 'ACRE', 'AVAILABLE', 'usr_003'],
  ['Pine Street Townhouse', 'HOUSE', 'SALE', 560000, 'Seattle', 'Capitol Hill', 3, 2, 1950, 'SQFT', 'SOLD', 'usr_001'],
  ['Aurora Apartments 4B', 'APARTMENT', 'RENT', 2350, 'Seattle', 'Aurora', 1, 1, 720, 'SQFT', 'RENTED', 'usr_002'],
];

export const properties: Property[] = rows.map(
  ([title, propertyType, listingType, price, city, area, bedrooms, bathrooms, areaSize, areaUnit, listingStatus, assignedTo], i) => ({
    _id: `prop_${String(i + 1).padStart(3, '0')}`,
    organizationId: ORG_ID,
    title,
    propertyType,
    listingType,
    price,
    currency: 'USD',
    city,
    area,
    bedrooms,
    bathrooms,
    areaSize,
    areaUnit,
    listingStatus,
    assignedTo,
    createdAt: daysAgo(i * 4 + 2),
  }),
);