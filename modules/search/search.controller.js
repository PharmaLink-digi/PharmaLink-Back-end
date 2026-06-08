import axios from "axios";
import { supabase } from "../../database/supabase.js";

// Basic LRU-like in-memory cache to avoid repeated API calls
const searchCache = new Map();
const MAX_CACHE_SIZE = 500;

export const searchMedicines = async (req, res) => {
    try {
        // 1. Receive the search query from the request URL
        const originalQuery = req.query.query;

        if (!originalQuery) {
            return res.status(400).json({ error: "Search query (query) is required" });
        }

        const normalizedQuery = originalQuery.trim().toLowerCase();

        // 6. Basic Caching: check if we already have the results
        if (searchCache.has(normalizedQuery)) {
            return res.json(searchCache.get(normalizedQuery));
        }

        let correctedQuery = normalizedQuery;

        // 2. Call FastAPI spell checker API
        try {
            const aiResponse = await axios.post("https://autocorrectmodel.onrender.com/correct", {
                name: originalQuery
            });

            // 3. Receive the corrected word
            if (aiResponse.data && aiResponse.data.correct_name_en) {
                correctedQuery = aiResponse.data.correct_name_en;
            }
        } catch (aiError) {
            // 5. Improve error handling: If FastAPI fails → fallback to original query
            console.error("FastAPI API failed, falling back to original query:", aiError.message);
        }

        // Extract root keyword (first word of the corrected query)
        const rootKeyword = correctedQuery.split(/\s+/)[0];

        // 4. Search medicines from Supabase using OR condition
        const { data: medications, error } = await supabase
            .from("t_medication")
            .select("*")
            .or(`medication_name.ilike.%${rootKeyword}%,medication_name.ilike.%${correctedQuery}%`);

        if (error) {
            console.error("Database search error:", error);
            return res.status(500).json({ error: "Failed to search medicines in database" });
        }

        let sortedMedications = [];
        if (medications && medications.length > 0) {
            // Remove duplicates if any based on medication_id
            const uniqueMap = new Map();
            medications.forEach(med => {
                uniqueMap.set(med.medication_id, med);
            });
            const uniqueMeds = Array.from(uniqueMap.values());

            // Sort by relevance (exact match > starts with corrected > includes corrected > starts with root > includes root)
            const lowerCorrected = correctedQuery.toLowerCase();
            const lowerRoot = rootKeyword.toLowerCase();

            sortedMedications = uniqueMeds.sort((a, b) => {
                const nameA = a.medication_name.toLowerCase();
                const nameB = b.medication_name.toLowerCase();

                const getScore = (name) => {
                    if (name === lowerCorrected) return 50;
                    if (name.startsWith(lowerCorrected)) return 40;
                    if (name.includes(lowerCorrected)) return 30;
                    if (name.startsWith(lowerRoot)) return 20;
                    if (name.includes(lowerRoot)) return 10;
                    return 0;
                };

                return getScore(nameB) - getScore(nameA);
            });
        }

        if (!sortedMedications || sortedMedications.length === 0) {
            return res.status(404).json({
                original_query: originalQuery,
                corrected_query: correctedQuery,
                results: []
            });
        }

        // Fetch prices to match getAllMedications behavior
        const { data: inventory, error: invError } = await supabase
            .from("t_pharm_inventory")
            .select("medication_id, price_sell");

        let searchResults = sortedMedications;
        if (!invError && inventory) {
            const priceMap = {};
            for (const inv of inventory) {
                if (!priceMap[inv.medication_id] || inv.price_sell < priceMap[inv.medication_id]) {
                    priceMap[inv.medication_id] = inv.price_sell;
                }
            }
            searchResults = sortedMedications.map(med => ({
                ...med,
                lowest_price: priceMap[med.medication_id] ?? null
            }));
        }

        // 5. Return original query, corrected query, and search results
        return res.json({
            original_query: originalQuery,
            corrected_query: correctedQuery,
            results: searchResults
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
