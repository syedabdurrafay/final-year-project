import { queryAPI } from "./api";

/**
 * insightsAPI:
 * - Generates insights from a natural language query.
 * - Sends query + database ID to backend.
 * - Backend handles SQL generation and execution via LLM.
 * - Returns human-readable insights + chart type + data.
 */
export const insightsAPI = {
  /**
   * generateInsights:
   * Main function called by the frontend.
   */
  generateInsights: async (naturalQuery, databaseId) => {
    try {
      if (!naturalQuery || !databaseId) {
        return { success: false, error: "Query text or database ID missing" };
      }

      // 1️⃣ Send request to backend
      const executePayload = {
        database_id: databaseId,
        natural_language_query: naturalQuery,
      };

      const result = await queryAPI.execute(executePayload);
      const returned = result?.data;
      console.log("Result from queryAPI.execute:", returned);

      if (!returned || returned.success === false) {
        // Guidance or error from backenbackenai_responseai_responsedai_responseai_responsed
        return {
          success: false,
          error: returned.message || "Query execution failed",
          guidance: returned.insights?.insight_text || null,
        };
      }

      const rows = Array.isArray(returned.data) ? returned.data : [];
      const sqlQuery = returned.sql_query || "";

      const insightText =
        returned.insights?.insight_text ||
        insightsAPI.generateInsightText(naturalQuery, rows);

      const chartType =
        returned.insights?.chart_type ||
        insightsAPI.determineChartType(naturalQuery, rows);

      return {
        success: true,
        insights: insightText,
        data: rows,
        chartType,
        query: naturalQuery,
        sqlQuery,
      };
    } catch (err) {
      console.error("Error generating insights:", err);
      return {
        success: false,
        error: err?.message || "Unexpected error while generating insights",
      };
    }
  },

  /**
   * generateInsightText:
   * Produces a short human summary from rows
   */
  generateInsightText: (naturalQuery, data) => {
    const q = (naturalQuery || "").toLowerCase();
    if (!Array.isArray(data)) data = [];

    // Sales / Revenue queries
    if ((q.includes("sales") || q.includes("revenue")) && data.length > 0) {
      const numbers = data.map(
        (r) =>
          parseFloat(r.total_sales ?? r.total_revenue ?? r.amount ?? 0) || 0
      );
      const sum = numbers.reduce((s, n) => s + n, 0);
      const peak = numbers.length ? Math.max(...numbers) : 0;
      return `Sales overview — total: ${sum.toLocaleString()}, peak: ${peak.toLocaleString()}, records: ${
        data.length
      }.`;
    }

    // Customer / User queries
    if ((q.includes("customer") || q.includes("user")) && data.length > 0) {
      const first = data[0];
      if (first && first.total_customers !== undefined) {
        return `Total customers: ${first.total_customers}`;
      }
      return `Customer dataset — ${data.length} rows. Example: ${JSON.stringify(
        first
      ).slice(0, 120)}`;
    }

    // Product queries
    if (q.includes("product") && data.length > 0) {
      const top = data[0];
      return `Product snapshot — ${data.length} rows. Top product: ${
        top.product_name ?? top.name ?? "N/A"
      }`;
    }

    // Generic dataset fallback
    if (data.length > 0) {
      return `Query executed successfully — ${data.length} rows returned.`;
    }

    return "No results found for your query.";
  },

  /**
   * determineChartType:
   * Picks a chart type heuristically based on query & data
   */
  determineChartType: (naturalQuery, data) => {
    const q = (naturalQuery || "").toLowerCase();

    if (
      q.includes("trend") ||
      q.includes("over time") ||
      q.includes("last quarter")
    )
      return "line";
    if (q.includes("compare") || q.includes("top") || q.includes("by"))
      return "bar";
    if (
      q.includes("distribution") ||
      q.includes("demograph") ||
      (Array.isArray(data) &&
        data.length > 0 &&
        Object.keys(data[0] || {}).length === 2)
    ) {
      return "pie";
    }

    // Default fallback
    return "table";
  },
};
