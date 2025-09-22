import os
import json
from typing import Optional, Tuple

import requests
import flask
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()  # 自动加载根目录的 .env 文件

def encode_geohash(latitude: float, longitude: float, precision: int = 7) -> str:
	"""Encode latitude/longitude into a geohash string.

	This implementation avoids an external dependency to keep deployment simple.
	"""
	# Geohash base32 map
	base32 = "0123456789bcdefghjkmnpqrstuvwxyz"

	# Latitude range and longitude range
	lat_interval = [-90.0, 90.0]
	lon_interval = [-180.0, 180.0]

	geohash_bits = []
	bit = 0
	ch = 0
	even_bit = True

	while len(geohash_bits) < precision:
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

		geohash_bits.append(base32[ch])
		bit = 0
		ch = 0

	return "".join(geohash_bits)


def get_env(name: str, default: Optional[str] = None) -> str:
	value = os.environ.get(name, default)
	if value is None:
		raise RuntimeError(f"Missing required environment variable: {name}")
	return value


app = Flask(__name__, static_folder="static", static_url_path="/static")

# Enable CORS for frontend development/production (frontend is a separate app)
# Configure allowed origins via env var CORS_ORIGINS (comma-separated) or default to "*" for /api/* routes
allowed_origins_env = os.environ.get("CORS_ORIGINS", "*")
if allowed_origins_env == "*":
	CORS(app, resources={r"/api/*": {"origins": "*"}})
else:
	origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
	CORS(app, resources={r"/api/*": {"origins": origins}})

# Lazy imports to avoid circulars and to keep main uncluttered
from services.ticketmaster_service import (
	encode_geohash as svc_encode_geohash,
	try_parse_latlon_from_string as svc_try_parse_latlon_from_string,
	geocode_location_to_latlon as svc_geocode_location_to_latlon,
	build_tm_event_search_params as svc_build_params,
	call_ticketmaster_events as svc_call_events,
	map_events_response as svc_map_events,
)


@app.route("/")
def index() -> "flask.Response":
	# Serve the static index.html without using templates (per assignment rules)
	return send_from_directory(app.static_folder, "index.html")


@app.route("/index.html")
def index_html() -> "flask.Response":
	# Provide explicit /index.html path for graders
	return send_from_directory(app.static_folder, "index.html")


@app.route("/api/health")
def health() -> "flask.Response":
	return jsonify({"status": "ok"})


@app.route("/api/search")
def api_search() -> "flask.Response":
	"""Search events via Ticketmaster Discovery API.

	Query params (GET):
	- keyword: required
	- radius: optional, default 10
	- segmentId: optional (category). If omitted or 'default', search all
	- location: preferred; human-readable location string (e.g., "Los Angeles, CA"), or "lat,lon"
	- lat, lon: optional; supported for backward-compat
	"""
	keyword = (request.args.get("keyword") or "").strip()
	radius = (request.args.get("radius") or "10").strip()
	segment_id = (request.args.get("segmentId") or "").strip()
	location_str = (request.args.get("location") or "").strip()
	lat_str = (request.args.get("lat") or "").strip()
	lon_str = (request.args.get("lon") or "").strip()

	if not keyword:
		return jsonify({"error": "Missing required parameter: keyword"}), 400

	lat: Optional[float] = None
	lon: Optional[float] = None

	# Priority 1: explicit lat/lon params if provided
	if lat_str and lon_str:
		try:
			lat = float(lat_str)
			lon = float(lon_str)
		except ValueError:
			return jsonify({"error": "Invalid coordinates (lat, lon)"}), 400

	# Priority 2: location string
	if (lat is None or lon is None) and location_str:
		# If location is already in "lat,lon" form, use it directly
		parsed = svc_try_parse_latlon_from_string(location_str)
		if parsed is not None:
			lat, lon = parsed
		else:
			# Geocode on the server using Google Geocoding API
			google_key = get_env("GOOGLE_API_KEY", None)
			try:
				lat, lon = svc_geocode_location_to_latlon(location_str, google_key)
			except requests.RequestException as ge:
				return jsonify({"error": "Geocoding request failed", "details": str(ge)}), 502
			except ValueError as ve:
				return jsonify({"error": "Geocoding failed", "details": str(ve)}), 400
			except Exception:
				return jsonify({"error": "Unexpected error during geocoding"}), 500

	if lat is None or lon is None:
		return jsonify({"error": "Missing location. Provide 'location' or (lat, lon)."}), 400

	try:
		precision = 7
		geo_point = svc_encode_geohash(lat, lon, precision)
	except Exception:
		return jsonify({"error": "Failed to encode geohash"}), 500

	api_key = get_env("TM_API_KEY", None)
	params = svc_build_params(keyword, radius, segment_id, geo_point, api_key)

	try:
		data = svc_call_events(params)
	except requests.HTTPError as http_err:
		return jsonify({"error": "Ticketmaster API HTTP error", "details": str(http_err)}), 502
	except requests.RequestException as req_err:
		return jsonify({"error": "Ticketmaster API request failed", "details": str(req_err)}), 502
	except ValueError:
		return jsonify({"error": "Invalid JSON from Ticketmaster API"}), 502

	# Return simplified mapping
	return jsonify(svc_map_events(data))


@app.route("/api/event/<event_id>")
def api_event_details(event_id: str) -> "flask.Response":
	api_key = get_env("TM_API_KEY", None)
	url = f"https://app.ticketmaster.com/discovery/v2/events/{event_id}"
	params = {"apikey": api_key}
	try:
		resp = requests.get(url, params=params, timeout=15)
		resp.raise_for_status()
		data = resp.json()
	except requests.HTTPError as http_err:
		return jsonify({"error": "Ticketmaster API HTTP error", "details": str(http_err)}), 502
	except requests.RequestException as req_err:
		return jsonify({"error": "Ticketmaster API request failed", "details": str(req_err)}), 502
	except ValueError:
		return jsonify({"error": "Invalid JSON from Ticketmaster API"}), 502

	return jsonify(data)


@app.route("/api/venue")
def api_venue() -> "flask.Response":
	keyword = (request.args.get("keyword") or "").strip()
	if not keyword:
		return jsonify({"error": "Missing required parameter: keyword"}), 400

	api_key = get_env("TM_API_KEY", None)
	url = "https://app.ticketmaster.com/discovery/v2/venues.json"
	params = {"apikey": api_key, "keyword": keyword}
	try:
		resp = requests.get(url, params=params, timeout=15)
		resp.raise_for_status()
		data = resp.json()
	except requests.HTTPError as http_err:
		return jsonify({"error": "Ticketmaster API HTTP error", "details": str(http_err)}), 502
	except requests.RequestException as req_err:
		return jsonify({"error": "Ticketmaster API request failed", "details": str(req_err)}), 502
	except ValueError:
		return jsonify({"error": "Invalid JSON from Ticketmaster API"}), 502

	return jsonify(data)


if __name__ == "__main__":
	port = int(os.environ.get("PORT", "8080"))
	app.run(host="0.0.0.0", port=port, debug=True)


