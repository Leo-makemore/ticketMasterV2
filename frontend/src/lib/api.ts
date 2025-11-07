import axios from "axios";
import type { SearchResponse } from "@/types/tm";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export async function health(): Promise<any> {
  const { data } = await api.get("/api/health");
  return data;
}

export async function searchEvents(params: {
  keyword: string;
  radius?: string;
  segmentId?: string;
  location: string; // either "City, State" or "lat,lon"
}): Promise<SearchResponse> {
  const { data } = await api.get("/api/search", { params });
  return data;
}

export async function fetchEventDetails(eventId: string): Promise<any> {
  const { data } = await api.get(`/api/event/${encodeURIComponent(eventId)}`);
  return data;
}

export async function fetchVenue(keyword: string): Promise<any> {
  const { data } = await api.get("/api/venue", { params: { keyword } });
  return data;
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ location: string; formatted_address: string }> {
  const { data } = await api.get("/api/geocode/reverse", { params: { lat, lon } });
  return data;
}


