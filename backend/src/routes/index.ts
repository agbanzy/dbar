import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { salesRouter } from "./sales";
import { inventoryRouter } from "./inventory";
import { expensesRouter } from "./expenses";
import { dashboardRouter } from "./dashboard";
import { productsRouter } from "./products";
import { reportsRouter } from "./reports";
import { usersRouter } from "./users";
import { ocrRouter } from "./ocr";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/sales", salesRouter);
router.use("/inventory", inventoryRouter);
router.use("/expenses", expensesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/products", productsRouter);
router.use("/reports", reportsRouter);
router.use("/users", usersRouter);
router.use("/ocr", ocrRouter);
