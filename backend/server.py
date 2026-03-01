"""
DagzFlix Backend Proxy — Forwards all /api/* requests to the Next.js server on port 3000.
The Kubernetes ingress routes /api/* to this backend (port 8001),
while the Next.js app handles both frontend and API routes on port 3000.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="DagzFlix Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEXTJS_URL = "http://localhost:3000"


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    target_url = f"{NEXTJS_URL}/api/{path}"
    query = str(request.url.query)
    if query:
        target_url += f"?{query}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    body = await request.body()

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )

    response_headers = dict(resp.headers)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-encoding", None)
    response_headers.pop("content-length", None)

    response = Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
    )

    for cookie_header in resp.headers.get_list("set-cookie"):
        response.headers.append("set-cookie", cookie_header)

    return response


@app.get("/health")
async def health():
    return {"status": "ok", "service": "dagzflix-proxy"}
