import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { getGrades, setPartialGrades, setSubstitutive, setWeights } from "../controllers/grade.controller.js";

const router = express.Router();

router.use(protect);

router.post("/partial", authorize("teacher"), setPartialGrades);

router.post("/substitutive", authorize("teacher"), setSubstitutive);

router.post("/weights", authorize("teacher"), setWeights);

router.get("/", authorize("teacher", "student"), getGrades);

export default router;
