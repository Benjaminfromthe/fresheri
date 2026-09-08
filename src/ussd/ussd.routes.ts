import { Router } from "express";
import { handleUSSD } from "./ussd.controller";

const router = Router();

/**
 * POST /ussd
 *
 * Africa's Talking USSD callback endpoint.
 * Content-Type: application/x-www-form-urlencoded
 *
 * Expected body fields:
 *   sessionId    – unique session identifier from the telco
 *   serviceCode  – USSD short code, e.g. *384#
 *   phoneNumber  – caller MSISDN, e.g. +254712345678
 *   text         – cumulative user inputs joined by "*", e.g. "1*2*500"
 *
 * Response: plain text starting with "CON " (continue) or "END " (terminate)
 */
router.post("/", handleUSSD);

export default router;
