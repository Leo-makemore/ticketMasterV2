"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, TrendingUp } from "lucide-react";
import { readRecent } from "@/lib/recent";

const POPULAR_KEYWORDS = [
  "Taylor Swift", "NBA", "Concert", "Theatre", "Comedy", "Jazz", "Rock", "Festival"
];

export default function SearchSuggestions({
  keyword,
  isOpen,
  onSelect,
  onClose,
}: {
  keyword: string;
  isOpen: boolean;
  onSelect: (kw: string) => void;
  onClose: () => void;
}) {
  const recent = readRecent();
  const recentKeywords = Array.from(new Set(recent.map(r => r.keyword).filter(Boolean))).slice(0, 5);
  const filteredPopular = POPULAR_KEYWORDS.filter(k => k.toLowerCase().includes(keyword.toLowerCase())).slice(0, 5);

  if (!isOpen || (!keyword && recentKeywords.length === 0 && filteredPopular.length === 0)) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-card shadow-lg backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            {keyword && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  Suggestions
                </div>
                {filteredPopular.length > 0 && (
                  <div className="space-y-1">
                    {filteredPopular.map((kw, i) => (
                      <motion.button
                        key={kw}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => { onSelect(kw); onClose(); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                      >
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>{kw}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {recentKeywords.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent
                </div>
                <div className="space-y-1">
                  {recentKeywords.map((kw, i) => (
                    <motion.button
                      key={kw}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (keyword ? filteredPopular.length : 0) * 0.03 + i * 0.03 }}
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
            {!keyword && recentKeywords.length === 0 && filteredPopular.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular
                </div>
                <div className="space-y-1">
                  {POPULAR_KEYWORDS.slice(0, 5).map((kw, i) => (
                    <motion.button
                      key={kw}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

