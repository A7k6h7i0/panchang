import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  kundali,
  festivals,
  matchmaking,
  muhurat,
  panchang,
} from "../controllers/astrologyController.js";

const router = express.Router();

// POST /api/astrology/kundali
router.post("/kundali", asyncHandler(kundali));

// POST /api/astrology/matchmaking
router.post("/matchmaking", asyncHandler(matchmaking));

// POST /api/astrology/muhurat
router.post("/muhurat", asyncHandler(muhurat));

// GET /api/astrology/panchang?date=YYYY-MM-DD&lat=&lng=
router.get("/panchang", asyncHandler(panchang));

// GET /api/astrology/festivals?year=YYYY&month=1-12&lat=&lng=
router.get("/festivals", asyncHandler(festivals));

export default router;
