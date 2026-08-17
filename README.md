# AWS Cloud Practitioner · Study Hub (CLF-C02)

Hub de estudio personal e interactivo para el examen **AWS Certified Cloud Practitioner (CLF-C02)**.
Preguntas tipo examen en español, con retroalimentación inmediata y descarte explicado de cada opción.

## Qué incluye

- **108 preguntas originales** organizadas en 9 frentes de práctica (CloudTrail vs CloudWatch, los 6 pilares, HA/DR/RPO/RTO, IAM, costos y soporte, migración y storage, infraestructura global, cómputo/redes/precios de EC2, y soporte/cuentas/Free Tier).
- **Motor anti-repetición**: prioriza las preguntas que no has visto o que viste hace más tiempo, usando tu progreso guardado.
- **Modo diagnóstico mixto** de 10 preguntas que mezcla todos los frentes.
- **Chuleta de repaso** con las diferencias que más se confunden.
- **Progreso local** guardado en el navegador (`localStorage`).
- **Funciona sin conexión (PWA)**: tras abrirla una vez con internet, queda cacheada para usarla offline (por ejemplo, en el metro).

## Abrir localmente

Puedes abrir `index.html` directamente en el navegador. El modo offline (service worker) solo se activa cuando la página se sirve por `http(s)` o desde `localhost`, no con `file://`.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio de GitHub.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`, y guarda.
4. En 1–2 minutos tu app estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
5. Ábrela una vez en el celular con señal para que quede disponible sin conexión.

## Estructura

- `index.html` — shell de la app y registro del service worker.
- `styles.css` — sistema visual.
- `app.js` — router por hash, vistas, progreso y motor de preguntas.
- `data/cloud-practitioner.js` — banco de preguntas, dominios, frentes y chuletas.
- `sw.js` — service worker para funcionamiento offline.
- `manifest.webmanifest` + `icon.svg` — metadatos para instalar la app en el celular.

## Nota

Herramienta personal de estudio, no afiliada a AWS. Los nombres de servicios son marcas de Amazon Web Services.
