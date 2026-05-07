import express from "express";
import axios from "axios";

const router = express.Router();

const HINDU_SEARCH_API_BASE_URL =
  process.env.HINDU_SEARCH_API_BASE_URL || "https://hindu-search.digitalleadpro.com";

const forwardRequest = async (req, res, method, path) => {
  try {
    const response = await axios({
      method,
      url: `${HINDU_SEARCH_API_BASE_URL}${path}`,
      params: req.query,
      data: req.body,
      timeout: 20000,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 502;
    const message =
      err?.response?.data ||
      err?.message ||
      "Failed to fetch data from Hindu Search API";
    res.status(status).json({ error: message });
  }
};

// Purohits
router.get("/purohits", (req, res) => forwardRequest(req, res, "get", "/api/purohits"));
router.get("/purohits/nearby", (req, res) => forwardRequest(req, res, "get", "/api/purohits/nearby"));
router.post("/purohits", (req, res) => forwardRequest(req, res, "post", "/api/purohits"));
router.delete("/purohits/:id", (req, res) =>
  forwardRequest(req, res, "delete", `/api/purohits/${encodeURIComponent(req.params.id)}`)
);

// Astrologers
router.get("/astrologers", (req, res) => forwardRequest(req, res, "get", "/api/astrologers"));
router.get("/astrologers/nearby", (req, res) =>
  forwardRequest(req, res, "get", "/api/astrologers/nearby")
);
router.post("/astrologers", (req, res) => forwardRequest(req, res, "post", "/api/astrologers"));
router.delete("/astrologers/:id", (req, res) =>
  forwardRequest(req, res, "delete", `/api/astrologers/${encodeURIComponent(req.params.id)}`)
);

// Temples
router.get("/temples", (req, res) => forwardRequest(req, res, "get", "/api/temples"));
router.get("/temples/nearby", (req, res) => forwardRequest(req, res, "get", "/api/temples/nearby"));
router.post("/temples", (req, res) => forwardRequest(req, res, "post", "/api/temples"));
router.delete("/temples/:id", (req, res) =>
  forwardRequest(req, res, "delete", `/api/temples/${encodeURIComponent(req.params.id)}`)
);

// Stores
router.get("/stores", (req, res) => forwardRequest(req, res, "get", "/api/stores"));
router.get("/stores/nearby", (req, res) => forwardRequest(req, res, "get", "/api/stores/nearby"));
router.post("/stores", (req, res) => forwardRequest(req, res, "post", "/api/stores"));
router.delete("/stores/:id", (req, res) =>
  forwardRequest(req, res, "delete", `/api/stores/${encodeURIComponent(req.params.id)}`)
);

export default router;
