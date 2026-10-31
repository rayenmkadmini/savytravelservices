// Declarative admin CRUD configuration (shared by server actions and forms).
import type { Dictionary } from "../i18n/dictionaries/fr";

type FieldLabel = keyof Dictionary["admin"]["fields"];

export type FieldDef =
  | { name: string; label: FieldLabel; type: "text" | "slug" | "textarea" | "image" | "date"; required?: boolean; max?: number }
  | { name: string; label: FieldLabel; type: "i18n" | "i18nTextarea"; required?: boolean; max?: number }
  | { name: string; label: FieldLabel; type: "number"; required?: boolean; min?: number; max?: number; step?: number; default?: number }
  | { name: string; label: FieldLabel; type: "boolean" }
  | { name: string; label: FieldLabel; type: "select"; options: readonly string[]; optionLabels?: string; required?: boolean }
  | { name: string; label: FieldLabel; type: "reference"; table: ReferenceTable; required?: boolean }
  | { name: string; label: FieldLabel; type: "lines" | "csv" }
  | { name: string; label: FieldLabel; type: "itinerary" };

export type ReferenceTable = "destinations" | "hotels" | "visa_countries";

export type ResourceDef = {
  key: string;
  table:
    | "destinations"
    | "travel_packages"
    | "hotels"
    | "hotel_rooms"
    | "visa_countries"
    | "visa_types"
    | "testimonials"
    | "articles"
    | "team_members";
  title: keyof Dictionary["admin"];
  /** Field shown as the row title in lists (i18n fields are translated). */
  labelField: string;
  /** Extra columns in the list view. */
  columns: string[];
  orderBy: { column: string; ascending: boolean };
  fields: FieldDef[];
  group: "catalog" | "content";
};

export const PACKAGE_CATEGORIES = ["leisure", "culture", "adventure", "honeymoon", "family", "pilgrimage", "business", "group"] as const;
export const VISA_CATEGORIES = ["tourist", "business", "student", "family", "transit", "work", "medical", "other"] as const;
export const BOARDS = ["room_only", "bed_breakfast", "half_board", "full_board", "all_inclusive"] as const;
export const CURRENCIES = ["TND", "EUR", "USD"] as const;

const publishing: FieldDef[] = [
  { name: "is_published", label: "published", type: "boolean" },
  { name: "sort_order", label: "sortOrder", type: "number", min: -1000, max: 100000, default: 0 },
];

export const resources: ResourceDef[] = [
  {
    key: "destinations",
    table: "destinations",
    title: "destinations",
    labelField: "name",
    columns: ["region", "is_featured", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "name", label: "name", type: "i18n", required: true, max: 120 },
      { name: "slug", label: "slug", type: "slug", required: true },
      { name: "country", label: "country", type: "i18n", required: true, max: 120 },
      { name: "region", label: "region", type: "select", options: ["tunisia", "international"], optionLabels: "admin.fields.regions" },
      { name: "tagline", label: "tagline", type: "i18n", max: 160 },
      { name: "description", label: "description", type: "i18nTextarea", max: 6000 },
      { name: "image_url", label: "image", type: "image" },
      { name: "image_credit", label: "imageCredit", type: "text", max: 200 },
      { name: "is_featured", label: "featured", type: "boolean" },
      ...publishing,
    ],
  },
  {
    key: "packages",
    table: "travel_packages",
    title: "packages",
    labelField: "title",
    columns: ["category", "price_from", "is_featured", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "title", label: "title", type: "i18n", required: true, max: 160 },
      { name: "slug", label: "slug", type: "slug", required: true },
      { name: "destination_id", label: "destination", type: "reference", table: "destinations" },
      { name: "category", label: "category", type: "select", options: PACKAGE_CATEGORIES, optionLabels: "packages.categories" },
      { name: "summary", label: "summary", type: "i18nTextarea", max: 400 },
      { name: "description", label: "description", type: "i18nTextarea", max: 10000 },
      { name: "duration_days", label: "durationDays", type: "number", required: true, min: 1, max: 90 },
      { name: "duration_nights", label: "durationNights", type: "number", required: true, min: 0, max: 90 },
      { name: "price_from", label: "priceFrom", type: "number", min: 0, max: 10000000, step: 0.001 },
      { name: "currency", label: "currency", type: "select", options: CURRENCIES },
      { name: "max_travelers", label: "maxTravelers", type: "number", min: 1, max: 500 },
      { name: "included", label: "included", type: "i18nTextarea", max: 6000 },
      { name: "excluded", label: "excluded", type: "i18nTextarea", max: 6000 },
      { name: "itinerary", label: "itinerary", type: "itinerary" },
      { name: "cover_image_url", label: "image", type: "image" },
      { name: "image_credit", label: "imageCredit", type: "text", max: 200 },
      { name: "is_featured", label: "featured", type: "boolean" },
      ...publishing,
    ],
  },
  {
    key: "hotels",
    table: "hotels",
    title: "hotels",
    labelField: "name",
    columns: ["city", "stars", "price_from", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "name", label: "name", type: "text", required: true, max: 160 },
      { name: "slug", label: "slug", type: "slug", required: true },
      { name: "destination_id", label: "destination", type: "reference", table: "destinations" },
      { name: "city", label: "city", type: "text", required: true, max: 120 },
      { name: "address", label: "address", type: "text", max: 300 },
      { name: "stars", label: "stars", type: "number", min: 1, max: 5 },
      { name: "description", label: "description", type: "i18nTextarea", max: 8000 },
      { name: "amenities", label: "amenities", type: "csv" },
      { name: "price_from", label: "priceFrom", type: "number", min: 0, max: 10000000, step: 0.001 },
      { name: "currency", label: "currency", type: "select", options: CURRENCIES },
      { name: "cover_image_url", label: "image", type: "image" },
      { name: "gallery", label: "gallery", type: "lines" },
      { name: "is_featured", label: "featured", type: "boolean" },
      ...publishing,
    ],
  },
  {
    key: "rooms",
    table: "hotel_rooms",
    title: "rooms",
    labelField: "name",
    columns: ["hotel_id", "board", "price_from", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "hotel_id", label: "hotel", type: "reference", table: "hotels", required: true },
      { name: "name", label: "name", type: "i18n", required: true, max: 120 },
      { name: "description", label: "description", type: "i18nTextarea", max: 2000 },
      { name: "board", label: "board", type: "select", options: BOARDS, optionLabels: "hotels.boards" },
      { name: "max_adults", label: "maxAdults", type: "number", required: true, min: 1, max: 12 },
      { name: "max_children", label: "maxChildren", type: "number", required: true, min: 0, max: 12 },
      { name: "price_from", label: "priceFrom", type: "number", min: 0, max: 10000000, step: 0.001 },
      ...publishing,
    ],
  },
  {
    key: "visa-countries",
    table: "visa_countries",
    title: "visaCountries",
    labelField: "name",
    columns: ["iso_code", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "name", label: "name", type: "i18n", required: true, max: 120 },
      { name: "slug", label: "slug", type: "slug", required: true },
      { name: "iso_code", label: "isoCode", type: "text", required: true, max: 2 },
      { name: "overview", label: "overview", type: "i18nTextarea", max: 4000 },
      { name: "image_url", label: "image", type: "image" },
      ...publishing,
    ],
  },
  {
    key: "visa-types",
    table: "visa_types",
    title: "visaTypes",
    labelField: "name",
    columns: ["country_id", "category", "is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "catalog",
    fields: [
      { name: "country_id", label: "country", type: "reference", table: "visa_countries", required: true },
      { name: "name", label: "name", type: "i18n", required: true, max: 160 },
      { name: "category", label: "category", type: "select", options: VISA_CATEGORIES, optionLabels: "visa.categories" },
      { name: "description", label: "description", type: "i18nTextarea", max: 4000 },
      { name: "required_documents", label: "requiredDocuments", type: "i18nTextarea", max: 6000 },
      { name: "processing_time", label: "processingTime", type: "i18n", max: 200 },
      { name: "fee_info", label: "feeInfo", type: "i18n", max: 300 },
      ...publishing,
    ],
  },
  {
    key: "testimonials",
    table: "testimonials",
    title: "testimonials",
    labelField: "author_name",
    columns: ["rating", "locale", "is_published"],
    orderBy: { column: "created_at", ascending: false },
    group: "content",
    fields: [
      { name: "author_name", label: "author", type: "text", required: true, max: 120 },
      { name: "author_location", label: "location", type: "text", max: 120 },
      { name: "content", label: "content", type: "textarea", required: true, max: 1500 },
      { name: "rating", label: "rating", type: "number", required: true, min: 1, max: 5 },
      { name: "locale", label: "locale", type: "select", options: ["fr", "en", "ar"] },
      ...publishing,
    ],
  },
  {
    key: "articles",
    table: "articles",
    title: "articles",
    labelField: "title",
    columns: ["published_at", "is_published"],
    orderBy: { column: "created_at", ascending: false },
    group: "content",
    fields: [
      { name: "title", label: "title", type: "i18n", required: true, max: 200 },
      { name: "slug", label: "slug", type: "slug", required: true },
      { name: "destination_id", label: "destination", type: "reference", table: "destinations" },
      { name: "excerpt", label: "excerpt", type: "i18nTextarea", max: 500 },
      { name: "body", label: "body", type: "i18nTextarea", max: 40000 },
      { name: "cover_image_url", label: "image", type: "image" },
      { name: "image_credit", label: "imageCredit", type: "text", max: 200 },
      { name: "is_published", label: "published", type: "boolean" },
    ],
  },
  {
    key: "team",
    table: "team_members",
    title: "team",
    labelField: "full_name",
    columns: ["is_published"],
    orderBy: { column: "sort_order", ascending: true },
    group: "content",
    fields: [
      { name: "full_name", label: "fullName", type: "text", required: true, max: 120 },
      { name: "position", label: "position", type: "i18n", required: true, max: 120 },
      { name: "bio", label: "bio", type: "i18nTextarea", max: 2000 },
      { name: "photo_url", label: "photo", type: "image" },
      ...publishing,
    ],
  },
];

export function getResource(key: string): ResourceDef | undefined {
  return resources.find((r) => r.key === key);
}
