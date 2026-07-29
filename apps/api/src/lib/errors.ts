import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const notFound: RequestHandler = (_request, response) =>
  response.status(404).json({ error: { code: "NOT_FOUND", message: "The requested resource was not found.", details: [] } });

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "The request could not be validated.", details: error.issues }
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return response.status(404).json({
      error: { code: "NOT_FOUND", message: "The requested resource was not found.", details: [] }
    });
  }
  const status = typeof error?.status === "number" ? error.status : 500;
  if (status >= 400 && status < 500) {
    return response.status(status).json({
      error: { code: "REQUEST_ERROR", message: error instanceof Error ? error.message : "Request failed", details: [] }
    });
  }
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", details: [] } });
};
