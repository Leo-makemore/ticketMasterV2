"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, TrendingUp, MapPin, Tag } from "lucide-react";
import { readRecent, type RecentItem } from "@/lib/recent";

const POPULAR_KEYWORDS = [
  "Taylor Swift", "NBA", "Concert", "Theatre", "Comedy", "Jazz", "Rock", "Festival", 
  "Basketball", "Baseball", "Football", "Hockey", "Soccer", "Tennis", "Golf",
  "Broadway", "Musical", "Dance", "Opera", "Symphony", "Orchestra"
];

const CATEGORY_LABELS: Record<string, string> = {
  "default": "All",
  "KZFzniwnSyZfZ7v7nJ": "Music",
  "KZFzniwnSyZfZ7v7nE": "Sports",
  "KZFzniwnSyZfZ7v7na": "Arts & Theatre",
  "KZFzniwnSyZfZ7v7nn": "Film",
  "KZFzniwnSyZfZ7v7n1": "Misc",
};

export default function SearchSuggestions({
  keyword,
  isOpen,
  onSelect,
  onSelectFull,
  onClose,
}: {
  keyword: string;
  isOpen: boolean;
  onSelect: (kw: string) => void;
  onSelectFull?: (item: RecentItem) => void;
  onClose: () => void;
}) {
  const recent = readRecent();
  const keywordLower = keyword.toLowerCase().trim();
  
  // Filter recent searches by keyword
  const filteredRecent = keywordLower
    ? recent.filter(r => 
        r.keyword.toLowerCase().includes(keywordLower) ||
        r.location.toLowerCase().includes(keywordLower)
      ).slice(0, 5)
    : recent.slice(0, 5);
  
  // Get unique recent keywords
  const recentKeywords = Array.from(
    new Set(recent.map(r => r.keyword).filter(Boolean))
  ).filter(kw => 
    !keywordLower || kw.toLowerCase().includes(keywordLower)
  ).slice(0, 5);
  
  // Filter popular keywords
  const filteredPopular = keywordLower
    ? POPULAR_KEYWORDS.filter(k => 
        k.toLowerCase().includes(keywordLower)
      ).slice(0, 5)
    : POPULAR_KEYWORDS.slice(0, 5);

  const hasContent = filteredRecent.length > 0 || recentKeywords.length > 0 || filteredPopular.length > 0;

  if (!isOpen || !hasContent) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-card shadow-lg backdrop-blur-sm max-h-[400px] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            {/* Recent Full Searches */}
            {filteredRecent.length > 0 && onSelectFull && (
              <div className="mb-3">
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                <div className="space-y-1">
                  {filteredRecent.map((item, i) => (
                    <motion.button
                      key={`${item.keyword}_${item.location}_${item.category}_${item.ts}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => { onSelectFull(item); onClose(); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors flex flex-col gap-1 text-sm group"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{item.keyword}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {CATEGORY_LABELS[item.category] || "All"}
                        </span>
                        <span>{item.radius} mi</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Keywords */}
            {filteredPopular.length > 0 && (
              <div className={filteredRecent.length > 0 ? "mb-3" : ""}>
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  {keywordLower ? "Suggestions" : "Popular"}
                </div>
                <div className="space-y-1">
                  {filteredPopular.map((kw, i) => (
                    <motion.button
                      key={kw}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (filteredRecent.length * 0.02) + i * 0.02 }}
                      onClick={() => { onSelect(kw); onClose(); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{kw}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Keywords Only (if no full search selected) */}
            {recentKeywords.length > 0 && !onSelectFull && (
              <div>
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Keywords
                </div>
                <div className="space-y-1">
                  {recentKeywords.map((kw, i) => (
                    <motion.button
                      key={kw}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (filteredPopular.length * 0.02) + i * 0.02 }}
                      onClick={() => { onSelect(kw); onClose(); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{kw}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

