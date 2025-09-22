export type MappedEvent = {
  id: string;
  name: string;
  dateTime: string;
  genre: string;
  venue: string;
  icon: string;
};

export type SearchResponse = {
  events: MappedEvent[];
};

export type RawEvent = any; // fallback for raw Ticketmaster objects


