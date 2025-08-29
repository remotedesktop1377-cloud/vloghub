export interface LocationOption {
  value: string;
  label: string;
  flag?: string;
  type: 'region' | 'city' | 'country' | 'global';
  parent?: string; // For cities, reference to country
}

export interface LocationData {
  regions: LocationOption[];
  cities: LocationOption[];
  countries: LocationOption[];
  category: LocationOption[];
}

export const locationData: LocationData = {
  regions: [
    { value: 'africa', label: 'Africa', flag: '', type: 'region' },
    { value: 'asia', label: 'Asia', flag: '', type: 'region' },
    { value: 'europe', label: 'Europe', flag: '🇪🇺', type: 'region' },
    { value: 'north-america', label: 'North America', flag: '', type: 'region' },
    { value: 'south-america', label: 'South America', flag: '', type: 'region' },
    { value: 'oceania', label: 'Oceania', flag: '', type: 'region' },
    { value: 'middle-east', label: 'Middle East', flag: '', type: 'region' },
    { value: 'southeast-asia', label: 'Southeast Asia', flag: '', type: 'region' },
    { value: 'central-asia', label: 'Central Asia', flag: '', type: 'region' },
    { value: 'east-asia', label: 'East Asia', flag: '', type: 'region' },
    { value: 'south-asia', label: 'South Asia', flag: '', type: 'region' },
    { value: 'western-europe', label: 'Western Europe', flag: '', type: 'region' },
    { value: 'eastern-europe', label: 'Eastern Europe', flag: '', type: 'region' },
    { value: 'northern-europe', label: 'Northern Europe', flag: '', type: 'region' },
    { value: 'southern-europe', label: 'Southern Europe', flag: '', type: 'region' },
  ],

  cities: [
    // Pakistan Cities
    { value: 'karachi', label: 'Karachi', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'lahore', label: 'Lahore', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'islamabad', label: 'Islamabad', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'faisalabad', label: 'Faisalabad', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'rawalpindi', label: 'Rawalpindi', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'multan', label: 'Multan', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'peshawar', label: 'Peshawar', flag: '', type: 'city', parent: 'pakistan' },
    { value: 'quetta', label: 'Quetta', flag: '', type: 'city', parent: 'pakistan' },

    // India Cities
    { value: 'mumbai', label: 'Mumbai', flag: '', type: 'city', parent: 'india' },
    { value: 'delhi', label: 'Delhi', flag: '', type: 'city', parent: 'india' },
    { value: 'bangalore', label: 'Bangalore', flag: '', type: 'city', parent: 'india' },
    { value: 'hyderabad', label: 'Hyderabad', flag: '', type: 'city', parent: 'india' },
    { value: 'chennai', label: 'Chennai', flag: '', type: 'city', parent: 'india' },
    { value: 'kolkata', label: 'Kolkata', flag: '', type: 'city', parent: 'india' },

    // US Cities
    { value: 'new-york', label: 'New York', flag: '', type: 'city', parent: 'usa' },
    { value: 'los-angeles', label: 'Los Angeles', flag: '', type: 'city', parent: 'usa' },
    { value: 'chicago', label: 'Chicago', flag: '', type: 'city', parent: 'usa' },
    { value: 'houston', label: 'Houston', flag: '', type: 'city', parent: 'usa' },
    { value: 'phoenix', label: 'Phoenix', flag: '', type: 'city', parent: 'usa' },
    { value: 'philadelphia', label: 'Philadelphia', flag: '', type: 'city', parent: 'usa' },

    // UK Cities
    { value: 'london', label: 'London', flag: '', type: 'city', parent: 'uk' },
    { value: 'manchester', label: 'Manchester', flag: '', type: 'city', parent: 'uk' },
    { value: 'birmingham', label: 'Birmingham', flag: '', type: 'city', parent: 'uk' },
    { value: 'leeds', label: 'Leeds', flag: '', type: 'city', parent: 'uk' },
    { value: 'liverpool', label: 'Liverpool', flag: '', type: 'city', parent: 'uk' },

    // Other Major Cities
    { value: 'tokyo', label: 'Tokyo', flag: '', type: 'city', parent: 'japan' },
    { value: 'sydney', label: 'Sydney', flag: '', type: 'city', parent: 'australia' },
    { value: 'toronto', label: 'Toronto', flag: '', type: 'city', parent: 'canada' },
    { value: 'berlin', label: 'Berlin', flag: '', type: 'city', parent: 'germany' },
    { value: 'paris', label: 'Paris', flag: '', type: 'city', parent: 'france' },
    { value: 'sao-paulo', label: 'São Paulo', flag: '', type: 'city', parent: 'brazil' },
    { value: 'mexico-city', label: 'Mexico City', flag: '', type: 'city', parent: 'mexico' },
    { value: 'lagos', label: 'Lagos', flag: '', type: 'city', parent: 'nigeria' },
    { value: 'cairo', label: 'Cairo', flag: '', type: 'city', parent: 'egypt' },
    { value: 'istanbul', label: 'Istanbul', flag: '', type: 'city', parent: 'turkey' },
    { value: 'jakarta', label: 'Jakarta', flag: '', type: 'city', parent: 'indonesia' },
    { value: 'kuala-lumpur', label: 'Kuala Lumpur', flag: '', type: 'city', parent: 'malaysia' },
    { value: 'bangkok', label: 'Bangkok', flag: '', type: 'city', parent: 'thailand' },
    { value: 'ho-chi-minh-city', label: 'Ho Chi Minh City', flag: '', type: 'city', parent: 'vietnam' },
  ],

  countries: [
    { value: 'pakistan', label: 'Pakistan', flag: '', type: 'country' },
    { value: 'india', label: 'India', flag: '', type: 'country' },
    { value: 'usa', label: 'United States', flag: '', type: 'country' },
    { value: 'uk', label: 'United Kingdom', flag: '', type: 'country' },
    { value: 'canada', label: 'Canada', flag: '', type: 'country' },
    { value: 'australia', label: 'Australia', flag: '', type: 'country' },
    { value: 'germany', label: 'Germany', flag: '', type: 'country' },
    { value: 'france', label: 'France', flag: '', type: 'country' },
    { value: 'japan', label: 'Japan', flag: '', type: 'country' },
    { value: 'brazil', label: 'Brazil', flag: '', type: 'country' },
    { value: 'mexico', label: 'Mexico', flag: '', type: 'country' },
    { value: 'south-africa', label: 'South Africa', flag: '', type: 'country' },
    { value: 'nigeria', label: 'Nigeria', flag: '', type: 'country' },
    { value: 'egypt', label: 'Egypt', flag: '', type: 'country' },
    { value: 'turkey', label: 'Turkey', flag: '', type: 'country' },
    { value: 'indonesia', label: 'Indonesia', flag: '', type: 'country' },
    { value: 'malaysia', label: 'Malaysia', flag: '', type: 'country' },
    { value: 'singapore', label: 'Singapore', flag: '', type: 'country' },
    { value: 'thailand', label: 'Thailand', flag: '', type: 'country' },
    { value: 'vietnam', label: 'Vietnam', flag: '', type: 'country' },
    { value: 'china', label: 'China', flag: '', type: 'country' },
    { value: 'russia', label: 'Russia', flag: '', type: 'country' },
    { value: 'south-korea', label: 'South Korea', flag: '', type: 'country' },
    { value: 'italy', label: 'Italy', flag: '', type: 'country' },
    { value: 'spain', label: 'Spain', flag: '', type: 'country' },
    { value: 'netherlands', label: 'Netherlands', flag: '🇳🇱', type: 'country' },
    { value: 'sweden', label: 'Sweden', flag: '', type: 'country' },
    { value: 'norway', label: 'Norway', flag: '', type: 'country' },
    { value: 'denmark', label: 'Denmark', flag: '', type: 'country' },
    { value: 'finland', label: 'Finland', flag: '', type: 'country' },
    { value: 'switzerland', label: 'Switzerland', flag: '', type: 'country' },
    { value: 'austria', label: 'Austria', flag: '', type: 'country' },
    { value: 'belgium', label: 'Belgium', flag: '', type: 'country' },
    { value: 'poland', label: 'Poland', flag: '', type: 'country' },
    { value: 'ukraine', label: 'Ukraine', flag: '', type: 'country' },
    { value: 'romania', label: 'Romania', flag: '', type: 'country' },
    { value: 'bulgaria', label: 'Bulgaria', flag: '', type: 'country' },
    { value: 'greece', label: 'Greece', flag: '', type: 'country' },
    { value: 'portugal', label: 'Portugal', flag: '', type: 'country' },
    { value: 'ireland', label: 'Ireland', flag: '', type: 'country' },
    { value: 'new-zealand', label: 'New Zealand', flag: '', type: 'country' },
    { value: 'argentina', label: 'Argentina', flag: '', type: 'country' },
    { value: 'chile', label: 'Chile', flag: '', type: 'country' },
    { value: 'colombia', label: 'Colombia', flag: '', type: 'country' },
    { value: 'peru', label: 'Peru', flag: '', type: 'country' },
    { value: 'venezuela', label: 'Venezuela', flag: '', type: 'country' },
    { value: 'ecuador', label: 'Ecuador', flag: '', type: 'country' },
    { value: 'bolivia', label: 'Bolivia', flag: '', type: 'country' },
    { value: 'uruguay', label: 'Uruguay', flag: '', type: 'country' },
    { value: 'paraguay', label: 'Paraguay', flag: '', type: 'country' },
    { value: 'guyana', label: 'Guyana', flag: '', type: 'country' },
    { value: 'suriname', label: 'Suriname', flag: '', type: 'country' },
    { value: 'french-guiana', label: 'French Guiana', flag: '', type: 'country' },
    { value: 'falkland-islands', label: 'Falkland Islands', flag: '', type: 'country' },
    { value: 'south-georgia', label: 'South Georgia', flag: '', type: 'country' },
    { value: 'antarctica', label: 'Antarctica', flag: '', type: 'country' },
  ],

  category: [
    { value: 'trending', label: 'Trending Everywhere', flag: '', type: 'global' },
    { value: 'viral', label: 'Viral Content', flag: '', type: 'global' },
    { value: 'breaking', label: 'Breaking News', flag: '', type: 'global' },
    { value: 'popular', label: 'Most Popular', flag: '', type: 'global' },
    { value: 'hot', label: 'Hot Topics', flag: '', type: 'global' },
    { value: 'trending-now', label: 'Trending Now', flag: '', type: 'global' },
    { value: 'top-stories', label: 'Top Stories', flag: '', type: 'global' },
  ]
};

// Helper function to get cities by country
export const getCitiesByCountry = (countryValue: string): LocationOption[] => {
  return locationData.cities.filter(city => city.parent === countryValue);
};

// Helper function to get all locations of a specific type
export const getLocationsByType = (type: 'region' | 'city' | 'country' | 'global'): LocationOption[] => {
  return locationData[type as keyof typeof locationData] || [];
};

// Helper function to get location by value
export const getLocationByValue = (value: string): LocationOption | undefined => {
  for (const category of Object.values(locationData)) {
    const found = category.find((location: any) => location.value === value);
    if (found) return found;
  }
  return undefined;
};

// Legacy support - keep the old regions export for backward compatibility
export const regions = locationData.regions;
export type Region = LocationOption;
