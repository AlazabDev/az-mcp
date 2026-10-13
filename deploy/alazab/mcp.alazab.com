# Alazab central MCP gateway — Nginx production template
# Replace __HUB_PORT__ ONLY with the verified az-mcp/MCPHub listening port.
# Existing upstreams below are copied from the supplied live Nginx file,
# NOT independently confirmed as running.
# Keep all other services' PM2 processes untouched.

server {
    listen 80;
    listen [::]:80;
    server_name mcp.alazab.com;
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type text/plain;
        try_files $uri =404;
    }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mcp.alazab.com;
    ssl_certificate /etc/letsencrypt/live/mcp.alazab.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.alazab.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:MCP_SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    client_max_body_size 25m;
    proxy_http_version 1.1;
    proxy_connect_timeout 30s;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_cache off;
    gzip off;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    access_log /var/log/nginx/mcp.alazab.com.access.log;
    error_log /var/log/nginx/mcp.alazab.com.error.log;

    # OAuth resource metadata: preserve Daftra's explicit resource-specific route.
    location = /.well-known/oauth-protected-resource/daftra/mcp {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
    }
    # The generic /.well-known/* routes below must belong to the central hub
    # (OAuth authorization metadata / resource metadata for ChatGPT clients).

    # Daftra service retains its native unmodified URI prefixes.
    location = /daftra { return 308 /daftra/; }
    location ^~ /daftra-docs {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 300s;
    }
    location ^~ /daftra/ {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # supabase: existing upstream configuration (availability not verified).
    location = /supabase { return 308 /supabase/; }
    location ^~ /supabase/ {
        # Trailing slash strips the external prefix, matching the supplied config.
        proxy_pass http://127.0.0.1:3110/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /supabase;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # magicplan: existing upstream configuration (availability not verified).
    location = /magicplan { return 308 /magicplan/; }
    location ^~ /magicplan/ {
        # Trailing slash strips the external prefix, matching the supplied config.
        proxy_pass http://127.0.0.1:3102/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /magicplan;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # uberfix: existing upstream configuration (availability not verified).
    location = /uberfix { return 308 /uberfix/; }
    location ^~ /uberfix/ {
        # Trailing slash strips the external prefix, matching the supplied config.
        proxy_pass http://127.0.0.1:3103/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /uberfix;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # azure: existing upstream configuration (availability not verified).
    location = /azure { return 308 /azure/; }
    location ^~ /azure/ {
        # Trailing slash strips the external prefix, matching the supplied config.
        proxy_pass http://127.0.0.1:3104/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /azure;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # whatsapp: existing upstream configuration (availability not verified).
    location = /whatsapp { return 308 /whatsapp/; }
    location ^~ /whatsapp/ {
        # Trailing slash strips the external prefix, matching the supplied config.
        proxy_pass http://127.0.0.1:3105/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /whatsapp;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        add_header X-Accel-Buffering "no" always;
    }
    # Navigation shortcuts only. These are NOT service MCP endpoints.
    # All 24 management pages are served by the central hub SPA.
    location = /agents { return 302 /integrations/agents; }
    location = /autodesk { return 302 /integrations/autodesk; }
    location = /env { return 302 /integrations/env; }
    location = /forms { return 302 /integrations/forms; }
    location = /foundry { return 302 /integrations/foundry; }
    location = /frappe { return 302 /integrations/frappe; }
    location = /gcp { return 302 /integrations/gcp; }
    location = /mail { return 302 /integrations/mail; }
    location = /mcp-app { return 302 /integrations/mcp-app; }
    location = /mcphub { return 302 /integrations/mcphub; }
    location = /minio { return 302 /integrations/minio; }
    location = /mongodb { return 302 /integrations/mongodb; }
    location = /nove { return 302 /integrations/nove; }
    location = /openapi { return 302 /integrations/openapi; }
    location = /oracle { return 302 /integrations/oracle; }
    location = /postgres { return 302 /integrations/postgres; }
    location = /storage { return 302 /integrations/storage; }
    location = /toolboxes { return 302 /integrations/toolboxes; }

    # Central hub: Dashboard, /chat, /chat/settings, /integrations/*,
    # /api/*, /mcp/*, OAuth and /.well-known/* (except resource-specific Daftra).
    # The upstream port must be determined from the REAL listening process.
    location / {
        proxy_pass http://127.0.0.1:8766/g;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;
        add_header X-Accel-Buffering "no" always;
    }
}
