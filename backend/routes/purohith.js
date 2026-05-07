import express from "express";
import axios from "axios";

const router = express.Router();

const HINDU_SEARCH_API_BASE_URL =
  process.env.HINDU_SEARCH_API_BASE_URL || "https://hindu-search.digitalleadpro.com";

/**
 * Forward request to external Hindu Search API
 */
const forwardToExternalAPI = async (req, res, method, path) => {
  try {
    const response = await axios({
      method,
      url: `${HINDU_SEARCH_API_BASE_URL}${path}`,
      params: req.query,
      data: req.body,
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 502;
    const message =
      err?.response?.data ||
      err?.message ||
      "Failed to fetch data from Hindu Search API";
    res.status(status).json({ success: false, error: message });
  }
};

// POST /api/purohith - Add one or more purohits (forwards to external API)
router.post("/", (req, res) => forwardToExternalAPI(req, res, "post", "/api/purohits"));

// GET /api/purohith - Search purohits (forwards to external API)
router.get("/", (req, res) => forwardToExternalAPI(req, res, "get", "/api/purohits"));

// GET /api/purohith/nearby - Get nearby purohits (forwards to external API)
router.get("/nearby", (req, res) => forwardToExternalAPI(req, res, "get", "/api/purohits/nearby"));

export default router;
