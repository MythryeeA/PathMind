from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_redoc_html

from .routers import topics, sessions, questions, answers, tutor, path, mastery, eval
from dependencies import rate_limiter

app = FastAPI(
    title="PathMind Backend",
    version="1.0.0",
    docs_url=None,  # Handled by custom /docs with CDN fallbacks
    redoc_url=None,  # Handled by custom /redoc
)

# CORS allowlist (PRD Section 9)
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Security headers middleware (PRD Section 9)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        # Don't apply restrictive CSP on API documentation routes or static assets
        doc_routes = ("/docs", "/redoc", "/scalar", "/openapi.json", "/static")
        if not any(request.url.path.startswith(p) for p in doc_routes):
            response.headers["Content-Security-Policy"] = "default-src 'self'"
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob:; "
                "style-src 'self' 'unsafe-inline' https: http:; "
                "font-src 'self' data: https: http:; "
                "img-src 'self' data: https: http:; "
                "connect-src 'self' https: http: ws:; "
                "worker-src 'self' blob:;"
            )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Mount local static files for Swagger UI assets if present
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Health endpoint (no auth required)
@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "PathMind API"}

# Custom /docs endpoint with local assets & multiple CDN fallbacks (Local -> CDNJS -> jsdelivr -> unpkg)
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>PathMind Backend - Swagger UI</title>
  <link rel="shortcut icon" href="/static/swagger-ui/favicon.png">
  <link rel="stylesheet" type="text/css" href="/static/swagger-ui/swagger-ui.css" id="swagger-css" onerror="tryFallbackCss(this)">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .doc-nav {
      background: #0f172a;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      font-size: 14px;
      border-bottom: 1px solid #1e293b;
    }
    .doc-nav-title {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .doc-nav-links {
      display: flex;
      gap: 8px;
    }
    .doc-nav-links a {
      color: #94a3b8;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.15s ease;
    }
    .doc-nav-links a:hover {
      color: #f8fafc;
      background: #1e293b;
    }
    .doc-nav-links a.active {
      color: #fff;
      background: #2563eb;
    }
    #error-banner {
      display: none;
      background: #fef2f2;
      border: 1px solid #f87171;
      color: #991b1b;
      padding: 14px 20px;
      margin: 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    #error-banner a {
      color: #1d4ed8;
      font-weight: 600;
      text-decoration: underline;
    }
  </style>
  <script>
    var cssSources = [
      '/static/swagger-ui/swagger-ui.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.css',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
    ];
    var cssIdx = 1;
    function tryFallbackCss(el) {
      if (cssIdx < cssSources.length) {
        el.href = cssSources[cssIdx++];
      }
    }
  </script>
</head>
<body>
  <div class="doc-nav">
    <div class="doc-nav-title">
      <span>PathMind Backend API</span>
    </div>
    <div class="doc-nav-links">
      <a href="/docs" class="active">Swagger UI</a>
      <a href="/scalar">Scalar</a>
      <a href="/redoc">ReDoc</a>
      <a href="/openapi.json" target="_blank">OpenAPI JSON</a>
    </div>
  </div>

  <div id="error-banner">
    ⚠️ <strong>Swagger UI failed to load:</strong> Assets could not be loaded from local files or CDNs. 
    You can view API documentation using <a href="/scalar">Scalar</a> or <a href="/redoc">ReDoc</a>.
  </div>

  <div id="swagger-ui"></div>

  <script>
    var swaggerInitialized = false;

    function initSwaggerUI() {
      if (swaggerInitialized) return;
      if (!window.SwaggerUIBundle) return;
      swaggerInitialized = true;

      var presets = [SwaggerUIBundle.presets.apis];
      if (window.SwaggerUIStandalonePreset) {
        presets.push(window.SwaggerUIStandalonePreset);
      }

      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: presets,
        layout: window.SwaggerUIStandalonePreset ? "StandaloneLayout" : "BaseLayout"
      });
    }

    var scriptSources = [
      {
        bundle: '/static/swagger-ui/swagger-ui-bundle.js',
        preset: '/static/swagger-ui/swagger-ui-standalone-preset.js'
      },
      {
        bundle: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.js',
        preset: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.js'
      },
      {
        bundle: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
        preset: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js'
      },
      {
        bundle: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
        preset: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js'
      }
    ];

    var currentSourceIdx = 0;

    function tryLoadScripts() {
      if (currentSourceIdx >= scriptSources.length) {
        if (!swaggerInitialized) {
          var banner = document.getElementById('error-banner');
          if (banner) banner.style.display = 'block';
        }
        return;
      }

      var src = scriptSources[currentSourceIdx++];
      var bundleScript = document.createElement('script');
      bundleScript.src = src.bundle;

      bundleScript.onload = function() {
        var presetScript = document.createElement('script');
        presetScript.src = src.preset;
        presetScript.onload = function() {
          initSwaggerUI();
        };
        presetScript.onerror = function() {
          // If preset fails, Swagger UI still works with BaseLayout
          initSwaggerUI();
        };
        document.body.appendChild(presetScript);
      };

      bundleScript.onerror = function() {
        tryLoadScripts();
      };

      document.body.appendChild(bundleScript);
    }

    tryLoadScripts();

    setTimeout(function() {
      if (!swaggerInitialized && !window.SwaggerUIBundle) {
        var banner = document.getElementById('error-banner');
        if (banner) banner.style.display = 'block';
      }
    }, 4000);
  </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)

# ReDoc endpoint as alternate viewer
@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
        redoc_favicon_url="/static/swagger-ui/favicon.png",
    )

# Scalar endpoint as modern API reference viewer
@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    html_content = """<!doctype html>
<html>
  <head>
    <title>PathMind Backend - Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="/static/swagger-ui/favicon.png">
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script>
      function loadScalarFallback() {
        var s = document.createElement('script');
        s.src = 'https://unpkg.com/@scalar/api-reference';
        document.body.appendChild(s);
      }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" onerror="loadScalarFallback()"></script>
  </body>
</html>"""
    return HTMLResponse(content=html_content)

# Register routers
app.include_router(topics.router, prefix="/topics", tags=["topics"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(questions.router, prefix="/sessions", tags=["questions"])
app.include_router(questions.router, prefix="/question", tags=["questions"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(answers.router, tags=["answers"])
app.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
app.include_router(path.router, prefix="/path", tags=["path"])
app.include_router(mastery.router, prefix="/mastery", tags=["mastery"])
app.include_router(eval.router, prefix="/eval", tags=["eval"])
