import axios from 'axios';

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  feelsLike: number;
  location: {
    name: string;
    country: string;
    region: string;
  };
}

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
}

// Indonesian major cities with coordinates
export const INDONESIAN_CITIES: LocationData[] = [
  { name: 'Jakarta', latitude: -6.2088, longitude: 106.8456, country: 'Indonesia', region: 'DKI Jakarta' },
  { name: 'Surabaya', latitude: -7.2575, longitude: 112.7521, country: 'Indonesia', region: 'East Java' },
  { name: 'Bandung', latitude: -6.9175, longitude: 107.6191, country: 'Indonesia', region: 'West Java' },
  { name: 'Medan', latitude: 3.5952, longitude: 98.6722, country: 'Indonesia', region: 'North Sumatra' },
  { name: 'Semarang', latitude: -6.9667, longitude: 110.4167, country: 'Indonesia', region: 'Central Java' },
  { name: 'Makassar', latitude: -5.1477, longitude: 119.4327, country: 'Indonesia', region: 'South Sulawesi' },
  { name: 'Palembang', latitude: -2.9761, longitude: 104.7754, country: 'Indonesia', region: 'South Sumatra' },
  { name: 'Tangerang', latitude: -6.1783, longitude: 106.6319, country: 'Indonesia', region: 'Banten' },
  { name: 'Depok', latitude: -6.4025, longitude: 106.7942, country: 'Indonesia', region: 'West Java' },
  { name: 'Bekasi', latitude: -6.2383, longitude: 106.9756, country: 'Indonesia', region: 'West Java' },
  { name: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695, country: 'Indonesia', region: 'Special Region of Yogyakarta' },
  { name: 'Malang', latitude: -7.9666, longitude: 112.6326, country: 'Indonesia', region: 'East Java' },
  { name: 'Bogor', latitude: -6.5944, longitude: 106.7892, country: 'Indonesia', region: 'West Java' },
  { name: 'Batam', latitude: 1.0456, longitude: 104.0305, country: 'Indonesia', region: 'Riau Islands' },
  { name: 'Pekanbaru', latitude: 0.5333, longitude: 101.4500, country: 'Indonesia', region: 'Riau' },
];

export class WeatherService {
  private static instance: WeatherService;
  private readonly API_KEY = '7c9c4b8a8c8e4f5a9b2d3e4f5a6b7c8d'; // Demo API key - replace with real one
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Get weather data by coordinates
   */
  async getWeatherByCoordinates(
    latitude: number,
    longitude: number
  ): Promise<{ weather: WeatherData | null; error: string | null }> {
    try {
      const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Returning cached weather data');
        return { weather: cached.data, error: null };
      }

      console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);

      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.API_KEY,
          units: 'metric',
          lang: 'en',
        },
        timeout: 10000,
      });

      const data = response.data;
      const weather: WeatherData = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind?.speed || 0,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 0, // Convert to km
        uvIndex: 0, // Would need additional API call for UV index
        feelsLike: Math.round(data.main.feels_like),
        location: {
          name: data.name,
          country: data.sys.country,
          region: data.sys.country === 'ID' ? this.getIndonesianRegion(data.name) : '',
        },
      };

      // Cache the result
      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      return { weather, error: null };
    } catch (error) {
      console.error('Weather API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { weather: null, error: 'Weather request timed out' };
        }
        if (error.response?.status === 401) {
          return { weather: null, error: 'Weather API key invalid' };
        }
        if (error.response?.status === 429) {
          return { weather: null, error: 'Weather API rate limit exceeded' };
        }
      }
      
      return { 
        weather: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch weather data' 
      };
    }
  }

  /**
   * Get weather data by city name
   */
  async getWeatherByCity(cityName: string): Promise<{ weather: WeatherData | null; error: string | null }> {
    try {
      const cacheKey = `city:${cityName.toLowerCase()}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('Returning cached weather data for city');
        return { weather: cached.data, error: null };
      }

      console.log(`Fetching weather for city: ${cityName}`);

      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          q: `${cityName},ID`, // ID for Indonesia
          appid: this.API_KEY,
          units: 'metric',
          lang: 'en',
        },
        timeout: 10000,
      });

      const data = response.data;
      const weather: WeatherData = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind?.speed || 0,
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : 0,
        uvIndex: 0,
        feelsLike: Math.round(data.main.feels_like),
        location: {
          name: data.name,
          country: data.sys.country,
          region: this.getIndonesianRegion(data.name),
        },
      };

      // Cache the result
      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      return { weather, error: null };
    } catch (error) {
      console.error('Weather API error for city:', error);
      return { 
        weather: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch weather data' 
      };
    }
  }

  /**
   * Get mock weather data for demo purposes
   */
  getMockWeatherData(locationName: string = 'Jakarta'): WeatherData {
    const mockData: WeatherData = {
      temperature: 28,
      humidity: 75,
      description: 'partly cloudy',
      icon: '02d',
      windSpeed: 3.5,
      pressure: 1013,
      visibility: 10,
      uvIndex: 6,
      feelsLike: 32,
      location: {
        name: locationName,
        country: 'ID',
        region: this.getIndonesianRegion(locationName),
      },
    };

    return mockData;
  }

  /**
   * Get Indonesian region for a city
   */
  private getIndonesianRegion(cityName: string): string {
    const city = INDONESIAN_CITIES.find(c => 
      c.name.toLowerCase() === cityName.toLowerCase()
    );
    return city?.region || 'Indonesia';
  }

  /**
   * Clear weather cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get weather icon URL
   */
  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

// Convenience instance
export const weatherService = WeatherService.getInstance();