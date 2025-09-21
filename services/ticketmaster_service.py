from typing import Any, Dict, List, Optional, Tuple

import requests


def encode_geohash(latitude: float, longitude: float, precision: int = 7) -> str:
	"""Encode latitude/longitude into a geohash string."""
	base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
	lat_interval = [-90.0, 90.0]
	lon_interval = [-180.0, 180.0]
	geohash_chars: List[str] = []
	bit = 0
	ch = 0
	even_bit = True
	while len(geohash_chars) < precision:
		if even_bit:
			mid = (lon_interval[0] + lon_interval[1]) / 2
			if longitude >= mid:
				ch |= 1 << (4 - bit)
				lon_interval[0] = mid
			else:
				lon_interval[1] = mid
		else:
			mid = (lat_interval[0] + lat_interval[1]) / 2
			if latitude >= mid:
				ch |= 1 << (4 - bit)
				lat_interval[0] = mid
			else:
				lat_interval[1] = mid
		even_bit = not even_bit
		if bit < 4:
			bit += 1
			continue
		geohash_chars.append(base32[ch])
		bit = 0
		ch = 0
	return "".join(geohash_chars)


def try_parse_latlon_from_string(s: str) -> Optional[Tuple[float, float]]:
	parts = [p.strip() for p in s.split(",")]
	if len(parts) != 2:
		return None
	try:
		return float(parts[0]), float(parts[1])
	except ValueError:
		return None


def geocode_location_to_latlon(location_str: str, google_key: str) -> Tuple[float, float]:
	geo_url = "https://maps.googleapis.com/maps/api/geocode/json"
	resp = requests.get(geo_url, params={"address": location_str, "key": google_key}, timeout=15)
	resp.raise_for_status()
	data = resp.json()
	if data.get("status") != "OK" or not data.get("results"):
		raise ValueError(f"Geocoding failed: {data.get('status')}")
	loc = data["results"][0]["geometry"]["location"]
	return float(loc["lat"]), float(loc["lng"])  # type: ignore


def build_tm_event_search_params(keyword: str, radius: str, segment_id: str, geo_point: str, api_key: str) -> Dict[str, Any]:
	params: Dict[str, Any] = {
		"apikey": api_key,
		"keyword": keyword,
		"radius": radius or "10",
		"unit": "miles",
		"geoPoint": geo_point,
		"size": 20,
		"sort": "date,asc",
	}
	if segment_id and segment_id.lower() != "default":
		params["segmentId"] = segment_id
	return params


def call_ticketmaster_events(params: Dict[str, Any]) -> Dict[str, Any]:
	url = "https://app.ticketmaster.com/discovery/v2/events.json"
	resp = requests.get(url, params=params, timeout=15)
	resp.raise_for_status()
	return resp.json()


def _pick_smallest_image_url(images: Any) -> str:
	if not isinstance(images, list) or not images:
		return ""
	best_url = ""
	best_area = None
	for img in images:
		url = img.get("url") if isinstance(img, dict) else None
		w = img.get("width") if isinstance(img, dict) else None
		h = img.get("height") if isinstance(img, dict) else None
		if url is None:
			continue
		try:
			area = (int(w) if w is not None else 1) * (int(h) if h is not None else 1)
		except Exception:
			area = None
		if best_area is None and area is not None:
			best_area = area
			best_url = url
		elif area is not None and best_area is not None and area < best_area:
			best_area = area
			best_url = url
		elif best_url == "":
			best_url = url
	return best_url


def _extract_genres(e: Dict[str, Any]) -> str:
	parts: List[str] = []
	classifications = e.get("classifications")
	if isinstance(classifications, list) and classifications:
		c = classifications[0]
		for key in ("segment", "genre", "subGenre", "type", "subType"):
			name = c.get(key, {}).get("name") if isinstance(c, dict) else None
			if name and str(name).strip() and str(name).strip().lower() != "undefined":
				parts.append(str(name).strip())
	# de-duplicate preserving order
	seen = set()
	uniq = []
	for p in parts:
		if p not in seen:
			seen.add(p)
			uniq.append(p)
	return " | ".join(uniq) if uniq else "N/A"


def _combine_date_time(e: Dict[str, Any]) -> str:
	start = ((e.get("dates") or {}).get("start") or {})
	local_date = start.get("localDate") or ""
	local_time = start.get("localTime") or ""
	if local_date and local_time:
		return f"{local_date} {local_time}"
	return local_date or local_time or ""


def _first_venue_name(e: Dict[str, Any]) -> str:
	emb = e.get("_embedded") or {}
	venues = emb.get("venues")
	if isinstance(venues, list) and venues:
		name = (venues[0] or {}).get("name")
		return name or "N/A"
	return "N/A"


def map_events_response(data: Dict[str, Any]) -> Dict[str, Any]:
	events_src = ((data or {}).get("_embedded") or {}).get("events")
	result: List[Dict[str, Any]] = []
	if isinstance(events_src, list):
		for e in events_src:
			mapped = {
				"id": e.get("id", ""),
				"name": e.get("name", ""),
				"dateTime": _combine_date_time(e),
				"genre": _extract_genres(e),
				"venue": _first_venue_name(e),
				"icon": _pick_smallest_image_url(e.get("images")),
			}
			result.append(mapped)
	return {"events": result}


