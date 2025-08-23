import { useState, useCallback, useEffect } from "react";
import { supabase } from "../supabaseClient";

export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

export function useEnhancedSuggestions(enableGeocoding: boolean) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, []);

  // Get table structure to know available columns
  const getTableStructure = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setTableColumns(columns);
        console.log("Available columns:", columns);
      }
    } catch (err: any) {
      console.error("Error getting table structure:", err);
    }
  };

  // Enhanced suggestion fetching
  const fetchEnhancedSuggestions = useCallback(
    async (term: string): Promise<EnhancedSuggestion[]> => {
      if (!term || term.length < 2) return [];
      try {
        const enrichedSuggestions: EnhancedSuggestion[] = [];
        // Recent searches
        const matchingRecent = recentSearches
          .filter((search) => search.toLowerCase().includes(term.toLowerCase()))
          .slice(0, 2)
          .map((search) => ({
            text: search,
            type: "recent" as const,
            source: "Recent Search",
          }));
        enrichedSuggestions.push(...matchingRecent);
        // Database suggestions
        try {
          const { data: propertiesData, error: propertiesError } = await supabase
            .from("properties")
            .select("address, building_name, property_type, HomeType")
            .limit(50);
          if (!propertiesError && propertiesData && propertiesData.length > 0) {
            propertiesData.forEach((item) => {
              if (item.address && typeof item.address === "string") {
                const value = item.address.toLowerCase();
                if (value.includes(term.toLowerCase())) {
                  enrichedSuggestions.push({
                    text: item.address,
                    type: "database",
                    source: "Properties Database",
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }
              if (item.building_name && typeof item.building_name === "string") {
                const value = item.building_name.toLowerCase();
                if (
                  value.includes(term.toLowerCase()) &&
                  item.building_name !== item.address
                ) {
                  enrichedSuggestions.push({
                    text: item.building_name,
                    type: "database",
                    source: "Properties Database",
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }
            });
          }
          // Fallback to address table
          if (
            enrichedSuggestions.filter((s) => s.type === "database").length === 0
          ) {
            const { data: addressData, error: addressError } = await supabase
              .from("address")
              .select("*")
              .limit(50);
            if (!addressError && addressData && addressData.length > 0) {
              addressData.forEach((item) => {
                const possibleFields = [
                  "street_address",
                  "address",
                  "full_address",
                  "unit_number",
                  "unit",
                  "building_name",
                  "building",
                  "property_name",
                  "city",
                  "town",
                  "area",
                  "state",
                  "province",
                ];
                possibleFields.forEach((field) => {
                  if (item[field] && typeof item[field] === "string") {
                    const value = item[field].toString().toLowerCase();
                    const searchTerm = term.toLowerCase();
                    if (value.includes(searchTerm)) {
                      enrichedSuggestions.push({
                        text: item[field],
                        type: "database",
                        source: "Address Database",
                      });
                    }
                  }
                });
              });
            }
          }
        } catch (dbError) {
          console.error("Database suggestions error:", dbError);
        }
        // Geocoding suggestions (optional, left as a placeholder)
        // if (enableGeocoding && term.length >= 3) { ... }
        // Remove duplicates and sort
        const seen = new Set<string>();
        const uniqueSuggestions = enrichedSuggestions.filter((suggestion) => {
          const normalizedText = suggestion.text.toLowerCase().trim();
          if (seen.has(normalizedText)) return false;
          seen.add(normalizedText);
          return true;
        });
        // Sort
        const sortedSuggestions = uniqueSuggestions
          .sort((a, b) => {
            const termLower = term.toLowerCase();
            const aTextLower = a.text.toLowerCase();
            const bTextLower = b.text.toLowerCase();
            if (a.type === "recent" && b.type !== "recent") return -1;
            if (a.type !== "recent" && b.type === "recent") return 1;
            const aExact = aTextLower === termLower;
            const bExact = bTextLower === termLower;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            const aStarts = aTextLower.startsWith(termLower);
            const bStarts = bTextLower.startsWith(termLower);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.text.length - b.text.length;
          })
          .slice(0, 8);
        return sortedSuggestions;
      } catch (err: any) {
        console.error("Error in fetchEnhancedSuggestions:", err);
        return [];
      }
    },
    [enableGeocoding, recentSearches]
  );

  // Save recent searches to localStorage
  const addRecentSearch = (searchTerm: string) => {
    const updatedRecent = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
  };

  return {
    tableColumns,
    getTableStructure,
    recentSearches,
    setRecentSearches,
    fetchEnhancedSuggestions,
    addRecentSearch,
  };
}
