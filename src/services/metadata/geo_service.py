"""
Geographic location service for handling location data and mapping.
"""
import logging
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from src.models.metadata import GeoLocation, GeoLocationData, MetadataSource

logger = logging.getLogger(__name__)


class GeoLocationService:
    """Service for managing geographic locations."""
    
    def __init__(self, db: Session):
        """
        Initialize geo location service.
        
        Args:
            db: Database session.
        """
        self.db = db
        
        # Known locations database (simplified)
        self.known_locations = {
            "south africa": {
                "country": "South Africa", 
                "latitude": -30.5595, 
                "longitude": 22.9375
            },
            "cape town": {
                "country": "South Africa", 
                "region": "Western Cape", 
                "city": "Cape Town",
                "latitude": -33.9249, 
                "longitude": 18.4241
            },
            "johannesburg": {
                "country": "South Africa", 
                "region": "Gauteng", 
                "city": "Johannesburg",
                "latitude": -26.2041, 
                "longitude": 28.0473
            },
            "pretoria": {
                "country": "South Africa", 
                "region": "Gauteng", 
                "city": "Pretoria",
                "latitude": -25.7479, 
                "longitude": 28.2293
            },
            "durban": {
                "country": "South Africa", 
                "region": "KwaZulu-Natal", 
                "city": "Durban",
                "latitude": -29.8587, 
                "longitude": 31.0218
            },
            "robben island": {
                "country": "South Africa", 
                "region": "Western Cape", 
                "city": "Cape Town",
                "latitude": -33.8067, 
                "longitude": 18.3669
            },
            "soweto": {
                "country": "South Africa", 
                "region": "Gauteng", 
                "city": "Johannesburg",
                "latitude": -26.2678, 
                "longitude": 27.8585
            },
            "united nations": {
                "country": "United States", 
                "region": "New York", 
                "city": "New York",
                "latitude": 40.7489, 
                "longitude": -73.9680
            },
            "london": {
                "country": "United Kingdom", 
                "region": "England", 
                "city": "London",
                "latitude": 51.5074, 
                "longitude": -0.1278
            }
        }
    
    async def create_or_get_location(self, location_data: GeoLocationData) -> GeoLocation:
        """
        Create a new location or get existing one.
        
        Args:
            location_data: Location data.
            
        Returns:
            GeoLocation instance.
        """
        # Check if location already exists
        existing = self.db.query(GeoLocation).filter(
            GeoLocation.name == location_data.name
        ).first()
        
        if existing:
            return existing
        
        # Enhance location data if incomplete
        enhanced_data = await self._enhance_location_data(location_data)
        
        # Create new location
        location = GeoLocation(
            name=enhanced_data.name,
            latitude=enhanced_data.latitude,
            longitude=enhanced_data.longitude,
            country=enhanced_data.country,
            region=location_data.region,
            city=location_data.city,
            address=location_data.address,
            confidence=enhanced_data.confidence
        )
        
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        
        logger.info(f"Created location: {location_data.name}")
        return location
    
    async def _enhance_location_data(self, location_data: GeoLocationData) -> GeoLocationData:
        """
        Enhance location data with additional information.
        
        Args:
            location_data: Original location data.
            
        Returns:
            Enhanced location data.
        """
        enhanced = GeoLocationData(**location_data.dict())
        
        # Check known locations
        name_lower = location_data.name.lower()
        
        if name_lower in self.known_locations:
            known = self.known_locations[name_lower]
            
            if not enhanced.latitude:
                enhanced.latitude = known.get("latitude")
            if not enhanced.longitude:
                enhanced.longitude = known.get("longitude")
            if not enhanced.country:
                enhanced.country = known.get("country")
            if not enhanced.region:
                enhanced.region = known.get("region")
            if not enhanced.city:
                enhanced.city = known.get("city")
            
            # Increase confidence if we found a match
            enhanced.confidence = min(1.0, enhanced.confidence + 0.3)
        
        # Try to extract location info from the name
        if not enhanced.country:
            enhanced.country = self._extract_country_from_name(location_data.name)
        
        return enhanced
    
    def _extract_country_from_name(self, name: str) -> Optional[str]:
        """Extract country information from location name."""
        name_lower = name.lower()
        
        # Common country patterns
        if any(term in name_lower for term in ["south africa", "sa", "rsa"]):
            return "South Africa"
        elif any(term in name_lower for term in ["united states", "usa", "us", "america"]):
            return "United States"
        elif any(term in name_lower for term in ["united kingdom", "uk", "britain", "england"]):
            return "United Kingdom"
        
        return None
    
    def get_location_by_id(self, location_id: str) -> Optional[GeoLocation]:
        """Get location by ID."""
        return self.db.query(GeoLocation).filter(GeoLocation.id == location_id).first()
    
    def search_locations(
        self,
        query: Optional[str] = None,
        country: Optional[str] = None,
        region: Optional[str] = None,
        city: Optional[str] = None,
        limit: int = 20
    ) -> List[GeoLocation]:
        """
        Search locations.
        
        Args:
            query: Text search query.
            country: Country filter.
            region: Region filter.
            city: City filter.
            limit: Maximum results.
            
        Returns:
            List of matching locations.
        """
        db_query = self.db.query(GeoLocation)
        
        if query:
            search_term = f"%{query}%"
            db_query = db_query.filter(
                or_(
                    GeoLocation.name.ilike(search_term),
                    GeoLocation.address.ilike(search_term),
                    GeoLocation.city.ilike(search_term),
                    GeoLocation.region.ilike(search_term),
                    GeoLocation.country.ilike(search_term)
                )
            )
        
        if country:
            db_query = db_query.filter(GeoLocation.country.ilike(f"%{country}%"))
        
        if region:
            db_query = db_query.filter(GeoLocation.region.ilike(f"%{region}%"))
        
        if city:
            db_query = db_query.filter(GeoLocation.city.ilike(f"%{city}%"))
        
        return db_query.order_by(GeoLocation.confidence.desc()).limit(limit).all()
    
    def get_locations_near(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 50.0,
        limit: int = 10
    ) -> List[GeoLocation]:
        """
        Get locations near the given coordinates.
        
        Args:
            latitude: Latitude.
            longitude: Longitude.
            radius_km: Radius in kilometers.
            limit: Maximum results.
            
        Returns:
            List of nearby locations.
        """
        # Simple distance calculation (for more accuracy, use PostGIS)
        locations = self.db.query(GeoLocation).filter(
            and_(
                GeoLocation.latitude.isnot(None),
                GeoLocation.longitude.isnot(None)
            )
        ).all()
        
        nearby = []
        for location in locations:
            distance = self._calculate_distance(
                latitude, longitude,
                location.latitude, location.longitude
            )
            
            if distance <= radius_km:
                nearby.append((location, distance))
        
        # Sort by distance
        nearby.sort(key=lambda x: x[1])
        
        return [location for location, distance in nearby[:limit]]
    
    def _calculate_distance(
        self,
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> float:
        """
        Calculate distance between two points using Haversine formula.
        
        Args:
            lat1, lon1: First point coordinates.
            lat2, lon2: Second point coordinates.
            
        Returns:
            Distance in kilometers.
        """
        import math
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        r = 6371
        
        return c * r
    
    def extract_locations_from_text(self, text: str) -> List[GeoLocationData]:
        """
        Extract location mentions from text.
        
        Args:
            text: Text to analyze.
            
        Returns:
            List of potential locations.
        """
        locations = []
        text_lower = text.lower()
        
        # Check for known locations in text
        for location_name, location_info in self.known_locations.items():
            if location_name in text_lower:
                location_data = GeoLocationData(
                    name=location_name.title(),
                    latitude=location_info.get("latitude"),
                    longitude=location_info.get("longitude"),
                    country=location_info.get("country"),
                    region=location_info.get("region"),
                    city=location_info.get("city"),
                    confidence=0.8
                )
                locations.append(location_data)
        
        # Extract potential location patterns
        import re
        
        # Look for capitalized place names
        place_patterns = [
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # "Cape Town"
            r'\b[A-Z][a-z]+\b(?=\s+(?:city|town|province|region|country))',  # "Johannesburg city"
        ]
        
        for pattern in place_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if match.lower() not in [loc.name.lower() for loc in locations]:
                    location_data = GeoLocationData(
                        name=match,
                        confidence=0.5
                    )
                    locations.append(location_data)
        
        return locations
    
    def get_location_statistics(self) -> Dict[str, Any]:
        """Get location usage statistics."""
        total_locations = self.db.query(func.count(GeoLocation.id)).scalar()
        
        # Countries
        country_stats = (self.db.query(GeoLocation.country, func.count(GeoLocation.id))
                        .filter(GeoLocation.country.isnot(None))
                        .group_by(GeoLocation.country)
                        .order_by(func.count(GeoLocation.id).desc())
                        .all())
        
        # Most used locations (would need usage tracking)
        top_locations = (self.db.query(GeoLocation.name, GeoLocation.country)
                        .order_by(GeoLocation.confidence.desc())
                        .limit(10)
                        .all())
        
        return {
            "total_locations": total_locations,
            "by_country": dict(country_stats),
            "top_locations": [{"name": name, "country": country} for name, country in top_locations]
        }
    
    async def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to coordinates.
        
        Args:
            address: Address to geocode.
            
        Returns:
            (latitude, longitude) tuple or None.
        """
        # This is a placeholder - in production you'd use a real geocoding service
        # like Google Maps API, OpenStreetMap Nominatim, etc.
        
        address_lower = address.lower()
        
        # Check known locations
        for location_name, location_info in self.known_locations.items():
            if location_name in address_lower:
                return (location_info["latitude"], location_info["longitude"])
        
        return None
    
    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[GeoLocationData]:
        """
        Reverse geocode coordinates to location information.
        
        Args:
            latitude: Latitude.
            longitude: Longitude.
            
        Returns:
            Location data or None.
        """
        # Find the closest known location
        closest_location = None
        min_distance = float('inf')
        
        for location_name, location_info in self.known_locations.items():
            if "latitude" in location_info and "longitude" in location_info:
                distance = self._calculate_distance(
                    latitude, longitude,
                    location_info["latitude"], location_info["longitude"]
                )
                
                if distance < min_distance:
                    min_distance = distance
                    closest_location = (location_name, location_info)
        
        if closest_location and min_distance < 50:  # Within 50km
            location_name, location_info = closest_location
            return GeoLocationData(
                name=location_name.title(),
                latitude=latitude,
                longitude=longitude,
                country=location_info.get("country"),
                region=location_info.get("region"),
                city=location_info.get("city"),
                confidence=max(0.3, 1.0 - (min_distance / 100))  # Decrease confidence with distance
            )
        
        return None 