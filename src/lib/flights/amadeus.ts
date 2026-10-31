import "server-only";

/**
 * Amadeus Flight Offers Search (v2) adapter.
 * Docs: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
 *
 * Env: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, AMADEUS_ENV ("test" | "production"),
 *      AMADEUS_CURRENCY (default "TND").
 * Results are live airline offers; nothing is ever fabricated. Prices remain
 * indicative until the agency confirms and issues the ticket.
 */

export type FlightSearch = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: "economy" | "premium_economy" | "business" | "first";
};

export type FlightSegment = {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  carrier: string;
  carrierName: string;
  flightNumber: string;
};

export type FlightOffer = {
  id: string;
  price: number;
  currency: string;
  seats: number | null;
  itineraries: { duration: string; segments: FlightSegment[] }[];
  carriers: string[];
};

export type FlightSearchResult =
  | { status: "ok"; offers: FlightOffer[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

const CLASS_MAP = {
  economy: "ECONOMY",
  premium_economy: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
} as const;

export function isAmadeusConfigured(): boolean {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

function baseUrl(): string {
  return process.env.AMADEUS_ENV === "production" ? "https://api.amadeus.com" : "https://test.api.amadeus.com";
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;
  const res = await fetch(`${baseUrl()}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID!,
      client_secret: process.env.AMADEUS_CLIENT_SECRET!,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Amadeus auth failed (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export const IATA = /^[A-Z]{3}$/;

type RawOffer = {
  id: string;
  numberOfBookableSeats?: number;
  price: { grandTotal: string; currency: string };
  validatingAirlineCodes?: string[];
  itineraries: {
    duration: string;
    segments: {
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
    }[];
  }[];
};

export function parseOffers(json: { data?: RawOffer[]; dictionaries?: { carriers?: Record<string, string> } }): FlightOffer[] {
  const carriers = json.dictionaries?.carriers ?? {};
  return (json.data ?? []).map((offer) => {
    const itineraries = offer.itineraries.map((it) => ({
      duration: it.duration,
      segments: it.segments.map((s) => ({
        from: s.departure.iataCode,
        to: s.arrival.iataCode,
        departAt: s.departure.at,
        arriveAt: s.arrival.at,
        carrier: s.carrierCode,
        carrierName: carriers[s.carrierCode] ?? s.carrierCode,
        flightNumber: `${s.carrierCode}${s.number}`,
      })),
    }));
    const codes = new Set(itineraries.flatMap((it) => it.segments.map((s) => s.carrierName)));
    return {
      id: offer.id,
      price: Number(offer.price.grandTotal),
      currency: offer.price.currency,
      seats: offer.numberOfBookableSeats ?? null,
      itineraries,
      carriers: [...codes],
    };
  });
}

export async function searchFlights(search: FlightSearch): Promise<FlightSearchResult> {
  if (!isAmadeusConfigured()) return { status: "not_configured" };
  try {
    const params = new URLSearchParams({
      originLocationCode: search.origin,
      destinationLocationCode: search.destination,
      departureDate: search.departureDate,
      adults: String(search.adults),
      currencyCode: process.env.AMADEUS_CURRENCY || "TND",
      max: "20",
    });
    if (search.returnDate) params.set("returnDate", search.returnDate);
    if (search.children) params.set("children", String(search.children));
    if (search.infants) params.set("infants", String(search.infants));
    if (search.travelClass) params.set("travelClass", CLASS_MAP[search.travelClass]);

    const res = await fetch(`${baseUrl()}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[amadeus] search failed", res.status, body.slice(0, 500));
      return { status: "error", message: `HTTP ${res.status}` };
    }
    const offers = parseOffers(await res.json()).sort((a, b) => a.price - b.price);
    return { status: "ok", offers };
  } catch (err) {
    console.error("[amadeus] search error", err);
    return { status: "error", message: err instanceof Error ? err.message : "unknown" };
  }
}
