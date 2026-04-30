import { Router } from "express";
import {
  listSpecies,
  getSpeciesStats,
  getSpeciesById,
  createSpecies,
  updateSpecies,
  deleteSpecies,
} from "../controllers/species.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/stats", getSpeciesStats);
router.get("/", listSpecies);
router.get("/:id", getSpeciesById);
router.post("/", createSpecies);
router.put("/:id", updateSpecies);
router.delete("/:id", deleteSpecies);

export default router;
