# Quiniela MX · Front

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router

## Correr en local

1. Arranca la API (`backend`: `.\mvnw.cmd spring-boot:run`, puerto 8080).
2. Aquí: `npm install` (solo la primera vez) y `npm run dev` → http://localhost:5173

En desarrollo, Vite reenvía `/api` a `http://localhost:8080`, así que no hay que configurar nada más.

## Producción

`npm run build` genera `dist/` (archivos estáticos para S3 + CloudFront o cualquier hosting).
Si la API vive en otro dominio, define `VITE_API_URL=https://api.tudominio.com` al construir
y agrega el dominio del front en `CORS_ORIGINS` de la API.

## Estructura

- `src/api/cliente.ts` — llamadas a la API, tokens y renovación automática de sesión.
- `src/auth/` — contexto de sesión (`useAuth`) y rutas protegidas.
- `src/components/` — piezas reutilizables con el diseño de las pantallas (tarjeta de vidrio, campos, alertas).
- `src/pages/` — una por pantalla.
