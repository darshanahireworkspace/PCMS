import { corsHeaders } from "./cors.ts";

export const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

export const sendSuccess = (
  message: string,
  data: unknown = null,
  meta: Record<string, unknown> = {},
  status = 200
) => {
  return jsonResponse(
    {
      success: true,
      message,
      data,
      ...meta,
    },
    status
  );
};

export const sendError = (message: string, error: unknown = null, status = 500) => {
  return jsonResponse(
    {
      success: false,
      message,
      error:
        typeof error === "object" && error !== null
          ? (error as { message?: string }).message || String(error)
          : error,
    },
    status
  );
};
