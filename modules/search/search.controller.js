import axios from "axios";
import { supabase } from "../../database/supabase.js";

// Basic LRU-like in-memory cache to avoid repeated API calls
const searchCache = new Map();
const MAX_CACHE_SIZE = 500;

export const searchMedicines = async (req, res) => {
    try {
        // 1. Receive the search query from the frontend
        // Accept either 'query' or 'name' (frontend will send 'query', but fallback to 'name' or 'q')
        const queryTerm = req.query.query || req.query.name || req.query.q;

        if (!queryTerm) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const normalizedQuery = queryTerm.trim().toLowerCase();

        // 6. Basic Caching: check if we already have the results
        if (searchCache.has(normalizedQuery)) {
            return res.json(searchCache.get(normalizedQuery));
        }

        let correctedName = normalizedQuery;

        // 2. Call FastAPI spell checker API
        try {
            const fastApiUrl = process.env.FASTAPI_URL || "https://autocorrectmodel.onrender.com/correct";
            
            const aiResponse = await axios.post(fastApiUrl, {
                name: normalizedQuery // AI service MUST ONLY use field: "name"
            });

            // 3. Get corrected medicine name
            if (aiResponse.data && aiResponse.data.correct_name_en) {
                correctedName = aiResponse.data.correct_name_en;
            }
        } catch (aiError) {
            // 5. Improve error handling: If FastAPI fails → fallback to original query
            console.error("FastAPI API failed, falling back to original query:", aiError.message);
        }

        // 4. Search medicines from Database using the corrected word
        // Query Supabase using existing schema fields on t_medication
        const { data: searchResults, error: medError } = await supabase
            .from("t_medication")
            .select("*")
            .ilike("medication_name", `%${correctedName}%`);

        if (medError) {
            console.error("Database search error:", medError);
            return res.status(500).json({ error: "Failed to search medicines in database" });
        }

        // 5. Improve error handling: If DB not found → return proper 404 response
        if (!searchResults || searchResults.length === 0) {
            return res.status(404).json({ 
                error: "No medicines found",
                corrected_name_tried: correctedName
            });
        }

        // Fetch pricing to match getAllMedications format and map the result
        const medIds = searchResults.map(m => m.medication_id);
        const { data: inventory, error: invError } = await supabase
            .from("t_pharm_inventory")
            .select("medication_id, price_sell")
            .in("medication_id", medIds);

        const priceMap = {};
        if (inventory) {
            for (const inv of inventory) {
                if (!priceMap[inv.medication_id] || inv.price_sell < priceMap[inv.medication_id]) {
                    priceMap[inv.medication_id] = inv.price_sell;
                }
            }
        }

        // Map results with lowest_price as expected by the frontend
        const formattedResults = searchResults.map(med => ({
            ...med,
            lowest_price: priceMap[med.medication_id] ?? null
        }));

        const responseData = {
            original_query: queryTerm,
            corrected_query: correctedName,
            results: formattedResults
        };

        // Cache the successful result
        searchCache.set(normalizedQuery, responseData);
        if (searchCache.size > MAX_CACHE_SIZE) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }

        return res.json(responseData);

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
