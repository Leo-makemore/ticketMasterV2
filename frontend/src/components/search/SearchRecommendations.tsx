"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SearchRecommendationsProps {
  currentKeyword: string;
  currentCategory: string;
  currentLocation: string;
  onSearch: (params: { keyword: string; category?: string; location?: string }) => void;
}

const RELATED_KEYWORDS: Record<string, string[]> = {
  "Taylor Swift": ["Concert", "Pop Music", "Arena Tour", "Music Festival"],
  "NBA": ["Basketball", "Sports", "Basketball Game", "Professional Sports"],
  "Concert": ["Music", "Live Music", "Performance", "Entertainment"],
  "Theatre": ["Broadway", "Drama", "Musical", "Performance"],
  "Comedy": ["Stand-up", "Comedy Show", "Entertainment", "Laugh"],
  "Jazz": ["Music", "Jazz Concert", "Live Music", "Blues"],
  "Rock": ["Rock Concert", "Music", "Live Music", "Concert"],
  "Festival": ["Music Festival", "Outdoor", "Concert", "Event"],
};

const CATEGORY_RECOMMENDATIONS = [
  { label: "Music", value: "KZFzniwnSyZfZ7v7nJ", icon: "🎵" },
  { label: "Sports", value: "KZFzniwnSyZfZ7v7nE", icon: "⚽" },
  { label: "Arts & Theatre", value: "KZFzniwnSyZfZ7v7na", icon: "🎭" },
  { label: "Film", value: "KZFzniwnSyZfZ7v7nn", icon: "🎬" },
];

export default function SearchRecommendations({
  currentKeyword,
  currentCategory,
  currentLocation,
  onSearch,
}: SearchRecommendationsProps) {
  // Get related keywords based on current search
  const getRelatedKeywords = () => {
    if (!currentKeyword) return [];
    
    const keywordLower = currentKeyword.toLowerCase();
    for (const [key, related] of Object.entries(RELATED_KEYWORDS)) {
      if (keywordLower.includes(key.toLowerCase()) || key.toLowerCase().includes(keywordLower)) {
        return related.filter(k => k.toLowerCase() !== currentKeyword.toLowerCase()).slice(0, 4);
      }
    }
    
    // Default related keywords
    return ["Concert", "Music", "Event", "Entertainment"].filter(k => k.toLowerCase() !== currentKeyword.toLowerCase()).slice(0, 4);
  };

  const relatedKeywords = getRelatedKeywords();
  const otherCategories = CATEGORY_RECOMMENDATIONS.filter(c => c.value !== currentCategory);

  if (relatedKeywords.length === 0 && otherCategories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Search Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relatedKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Related Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedKeywords.map((kw) => (
                <Button
                  key={kw}
                  variant="outline"
                  size="sm"
                  onClick={() => onSearch({ keyword: kw, location: currentLocation })}
                  className="rounded-full"
                >
                  {kw}
                </Button>
              ))}
            </div>
          </div>
        )}

        {otherCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <span>Explore Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => (
                <Button
                  key={cat.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onSearch({ keyword: currentKeyword || "events", category: cat.value, location: currentLocation })}
                  className="rounded-full"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

