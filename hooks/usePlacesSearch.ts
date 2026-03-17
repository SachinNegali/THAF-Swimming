import { useCallback, useRef, useState } from 'react';

// ─── Constants ──────────────────────────────────────────
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBIaPQX7NEd3CBNIbRw93kKG890LPyXcWs';

// ─── Types ──────────────────────────────────────────────
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  name: string;
  lat: number;
  lng: number;
}

export interface UsePlacesSearchOptions {
  /** Optional location bias for proximity-based results */
  locationBias?: { latitude: number; longitude: number } | null;
  /** Country restriction (ISO 3166-1 alpha-2), defaults to 'in' */
  country?: string;
  /** Debounce delay in ms, defaults to 300 */
  debounceMs?: number;
  /** Max number of results to return, defaults to 5 */
  maxResults?: number;
}

export interface UsePlacesSearchReturn {
  searchQuery: string;
  searchResults: PlacePrediction[];
  isSearching: boolean;
  showSearchResults: boolean;
  onSearchTextChange: (text: string) => void;
  selectPlace: (prediction: PlacePrediction) => Promise<PlaceDetails | null>;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>;
  clearSearch: () => void;
  setSearchQuery: (query: string) => void;
  setShowSearchResults: (show: boolean) => void;
}

// ─── Hook ───────────────────────────────────────────────
export function usePlacesSearch(
  options: UsePlacesSearchOptions = {},
): UsePlacesSearchReturn {
  const {
    locationBias = null,
    country = 'in',
    debounceMs = 300,
    maxResults = 5,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autocomplete search ───────────────────────────────
  const searchPlaces = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      setIsSearching(true);
      try {
        const bias = locationBias
          ? `&location=${locationBias.latitude},${locationBias.longitude}&radius=50000`
          : '';
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query,
        )}&key=${GOOGLE_MAPS_API_KEY}${bias}&components=country:${country}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log("THE FUCK IS DATA.... SEARCH PLACES", data?.predictions?.[0])
        // getPlaceDetails(data?.predictions?.[0]?.place_id)
        if (data.status === 'OK' && data.predictions) {
          setSearchResults(data.predictions.slice(0, maxResults));
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [locationBias, country, maxResults],
  );

  // ── Debounced text change handler ─────────────────────
  const onSearchTextChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (!text.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      searchTimeoutRef.current = setTimeout(() => searchPlaces(text), debounceMs);
    },
    [searchPlaces, debounceMs],
  );

  // ── Get details for a specific place_id ───────────────
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log("THE FUCK IS DATA.... SEARCH PLACES Details", data?.result?.geometry?.location, data?.result?.geometry)
        if (data.status === 'OK' && data.result?.geometry?.location) {
          const { lat, lng } = data.result.geometry.location;
          return {
            name: data.result.name || '',
            lat,
            lng,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Select a prediction (convenience: sets query + fetches details) ──
  const selectPlace = useCallback(
    async (prediction: PlacePrediction): Promise<PlaceDetails | null> => {
      setSearchQuery(prediction.structured_formatting.main_text);
      setShowSearchResults(false);
      setSearchResults([]);
      const details = await getPlaceDetails(prediction.place_id);
      return details;
    },
    [getPlaceDetails],
  );

  // ── Clear everything ──────────────────────────────────
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    onSearchTextChange,
    selectPlace,
    getPlaceDetails,
    clearSearch,
    setSearchQuery,
    setShowSearchResults,
  };
}
