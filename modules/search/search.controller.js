import axios from "axios";
import { supabase } from "../../database/supabase.js";

export const searchMedicines = async (req, res) => {
    try {
        // 1. Receive the search query from the request URL
        const originalQuery = req.query.q;

        if (!originalQuery) {
            return res.status(400).json({ error: "Search query (q) is required" });
        }

        let correctedQuery = originalQuery;

        // 2. Send the query to the AI autocorrect API using axios
        try {
            const aiResponse = await axios.post("https://YOUR-AI-ENDPOINT.com/correct", {
                text: originalQuery
            });

            // 3. Receive the corrected word
            if (aiResponse.data && aiResponse.data.corrected) {
                correctedQuery = aiResponse.data.corrected;
            }
        } catch (aiError) {
            // FALLBACK: If the AI API fails, log error and continue with the original query
            console.error("AI API failed, falling back to original query:", aiError.message);
        }

        // 4. Search medicines from Supabase using the corrected word
        // using ilike for case-insensitive search on the "name" column
        const { data: searchResults, error } = await supabase
            .from("medicines")
            .select("*")
            .ilike("name", `%${correctedQuery}%`);

        if (error) {
            console.error("Supabase search error:", error);
            return res.status(500).json({ error: "Failed to search medicines in database" });
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
