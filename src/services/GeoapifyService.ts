export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoapifyProperties {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  category?: string;
  city?: string;
  country?: string;
  country_code?: string;
  county?: string;
  district?: string;
  postcode?: string;
  state?: string;
  suburb?: string;
  housenumber?: string;
  street?: string;
  name?: string;
  place_id: string;
  confidence?: number;
  distance?: number;
}

export interface GeoapifyFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: GeoapifyProperties;
}

export interface GeoapifyResponse {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
  query?: {
    text?: string;
    parsed?: unknown; // Changed 'any' to 'unknown'
  };
}

export class GeoapifyGeocodingService {
  private static readonly AUTOCOMPLETE_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY_AUTOCOMPLETE;
  private static readonly REVERSE_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY_REVERSE;
  private static readonly GEOCODING_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY_GEOCODING;
  
  private static readonly AUTOCOMPLETE_BASE_URL = import.meta.env.VITE_AUTOCOMPLETE_BASE_URL;
  private static readonly REVERSE_BASE_URL = import.meta.env.VITE_REVERSE_GEOCODING_BASE_URL;
  private static readonly GEOCODING_BASE_URL = import.meta.env.VITE_GEOCODING_BASE_URL;
  
  private static readonly GEOCODING_DELAY = 300; // Delay to prevent too many requests for autocomplete
  private static lastRequestTime = 0;
  private static readonly MAX_RETRIES = 2;
  private static readonly REQUEST_TIMEOUT = 10000;

  private static buildUrl(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl);
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    }
    return url.toString();
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static validateCoordinates(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180;
  }

  private static async makeRequest<T>(url: string, retryCount = 0): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      console.log(`Making Geoapify request to: ${url} (attempt ${retryCount + 1})`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }

      return await response.json() as T;
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      // Type guard for AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Geoapify request timed out after ${this.REQUEST_TIMEOUT}ms`);
        throw new Error('Geoapify request timed out');
      }

      if (retryCount < this.MAX_RETRIES) {
        console.warn(`Geoapify network error, retry ${retryCount + 1}/${this.MAX_RETRIES}:`, error.message);
        await this.delay(2000 * (retryCount + 1));
        return this.makeRequest<T>(url, retryCount + 1);
      }

      throw error;
    }
  }

  static async autocompleteAddress(address: string, focusPoint?: LatLng): Promise<GeoapifyFeature[]> {
    if (!address || address.trim().length < 3) {
      return [];
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      text: address,
      limit: 10,
      apiKey: this.AUTOCOMPLETE_API_KEY,
      filter: 'countrycode:my', // Filter results to Malaysia only
      format: 'geojson'
    };

    if (focusPoint && this.validateCoordinates(focusPoint.lat, focusPoint.lng)) {
      params.bias = `proximity:${focusPoint.lng},${focusPoint.lat}`;
    }

    try {
      const url = this.buildUrl(this.AUTOCOMPLETE_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Autocomplete Response:', data);
      return data.features || [];
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      if (error instanceof Error) {
        console.error("Geoapify Autocomplete error:", error.message || error);
        throw new Error(`Autocomplete failed: ${error.message || 'Unknown error'}`);
      } else {
        console.error("Geoapify Autocomplete error: An unknown error occurred", error);
        throw new Error(`Autocomplete failed: Unknown error`);
      }
    }
  }

  static async geocodeAddress(address: string, focusPoint?: LatLng): Promise<GeoapifyFeature[]> {
    if (!address || address.trim().length < 3) {
      return [];
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      text: address,
      limit: 10,
      apiKey: this.GEOCODING_API_KEY,
      filter: 'countrycode:my', // Filter results to Malaysia only
      format: 'geojson'
    };

    if (focusPoint && this.validateCoordinates(focusPoint.lat, focusPoint.lng)) {
      params.bias = `proximity:${focusPoint.lng},${focusPoint.lat}`;
    }

    try {
      const url = this.buildUrl(this.GEOCODING_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Geocode Response:', data);
      return data.features || [];
    } catch (error: any) {
      console.error("Geoapify Geocoding error:", error.message || error);
      throw new Error(`Geocoding failed: ${error.message || 'Unknown error'}`);
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<GeoapifyFeature | null> {
    if (!this.validateCoordinates(lat, lng)) {
      console.error(`Invalid coordinates for reverse geocoding: lat=${lat}, lng=${lng}`);
      throw new Error('Invalid coordinates provided');
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      lat: lat,
      lon: lng,
      limit: 1,
      apiKey: this.REVERSE_API_KEY,
      format: 'geojson'
    };

    try {
      const url = this.buildUrl(this.REVERSE_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Reverse Geocode Response:', data);

      if (data.features && data.features.length > 0) {
        return data.features[0];
      } else {
        console.warn('No reverse geocoding results found for:', { lat, lng });
        return null;
      }
    } catch (error: any) {
      console.error("Geoapify Reverse geocoding error:", error.message || error);
      throw new Error(`Reverse geocoding failed: ${error.message || 'Unknown error'}`);
    }
  }

  static async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn('Geolocation request timed out');
        resolve(null);
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (this.validateCoordinates(lat, lng)) {
            resolve({ lat, lng });
          } else {
            console.warn('Invalid coordinates from geolocation API:', { lat, lng });
            resolve(null);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('Error getting current position:', error.message);

          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.warn('User denied the request for Geolocation');
              break;
            case error.POSITION_UNAVAILABLE:
              console.warn('Location information is unavailable');
              break;
            case error.TIMEOUT:
              console.warn('The request to get user location timed out');
              break;
          }

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  static async testService(): Promise<boolean> {
    try {
      console.log('Testing Geoapify geocoding service...');
      const results = await this.geocodeAddress('Kuala Lumpur', {lat: 3.1390, lng: 101.6869});
      const serviceWorking = results && results.length > 0;

      if (serviceWorking) {
        console.log('✅ Geoapify service is working, found:', results[0].properties.formatted);
      } else {
        console.warn('⚠️ Geoapify service returned no results for test query');
      }

      return serviceWorking;
    } catch (error: any) {
      console.error('❌ Geoapify service test failed:', error.message);
      return false;
    }
  }
}
