import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle generic error structure if not already an ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof Error ? 500 : 400;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Supabase specific errors
  if (error.code && typeof error.code === 'string') {
    if (error.code === '23505') {
      error = new ApiError(409, "Duplicate record found", [], err.stack);
    }
    // Add other Supabase error codes as needed
  }

  const response = {
    success: false,
    message: error.message,
    error: {
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      details: error.errors
    },
  };

  return res.status(error.statusCode).json(response);
};
