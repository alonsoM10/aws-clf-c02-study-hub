# AWS Cloud Practitioner · Study Hub (CLF-C02)

Hub de estudio personal e interactivo para el examen **AWS Certified Cloud Practitioner (CLF-C02)**, en español. Preguntas tipo examen con retroalimentación inmediata y descarte explicado de cada opción, teoría, tarjetas, audios y simulacros — todo funciona **sin conexión** (PWA), ideal para estudiar en el metro.

**En vivo:** https://alonsom10.github.io/aws-clf-c02-study-hub/

## Modos de estudio

- **Inicio** — progreso, plan y accesos rápidos.
- **Aprender** — teoría en español dividida en los 4 dominios oficiales, con un "truco de examen" en cada tema.
- **Tarjetas** — 117 flashcards (servicio → qué hace + palabra gatillo), con filtros por categoría y modo "por repasar".
- **Escuchar** — 5 lecciones en audio que el propio teléfono lee en voz alta (Web Speech API, en español, offline). Para repasar sin mirar la pantalla.
- **Practicar** — por tema (15 frentes), por dominio (hasta 20 preguntas), o diagnóstico mixto.
- **Examen** — simulacro real de 65 preguntas, 90 minutos, con la distribución oficial por dominio, opciones barajadas, cronómetro, marcar preguntas y reporte con puntaje escalado (100–1000) y revisión.
- **Repaso** — comparaciones que más se confunden, **116 palabras gatillo** ("si el enunciado dice… piensa en…") y **trampas típicas** del examen.

## Características

- **243 preguntas** originales en español, incluyendo **casos de empresa** ("una empresa necesita X, ¿qué servicio?") y preguntas de **respuesta múltiple** (elegir 2).
- **Preguntas aleatorias y sin repetición:** al practicar, la app elige preguntas al azar del tema, prioriza las que no has visto recientemente y **baraja el orden de las opciones** (para que la respuesta correcta no caiga siempre en A/B).
- **Modo oscuro** con recuerdo de preferencia.
- **Exportar resultados** a un archivo `.md` con tu precisión por dominio/tema y las preguntas que fallaste (para revisar o pedir feedback).
- **Progreso local** en el navegador (`localStorage`); es independiente en cada dispositivo.
- **Funciona sin conexión (PWA)** con estrategia *network-first*: con internet siempre trae lo último; sin internet usa la última versión guardada.

## Abrir localmente

Puedes abrir `index.html` directamente en el navegador. El modo offline (service worker) solo se activa al servir la página por `http(s)` o `localhost`, no con `file://`.

## Publicar / actualizar en GitHub Pages

Ya está publicado. Para subir cambios:

```bash
git add . && git commit -m "descripcion del cambio" && git push
```

GitHub Pages se actualiza solo en 1–2 minutos. **Importante:** al cambiar código o preguntas, sube el número de versión de `CACHE_NAME` en `sw.js` (va por `vN`) para que los dispositivos bajen lo nuevo. Luego recarga con `Ctrl+Shift+R` (o cierra/reabre Safari en el iPhone).

## Estructura

- `index.html` — shell de la app, script anti-parpadeo de tema y registro del service worker.
- `styles.css` — sistema visual con variables de tema (claro/oscuro).
- `app.js` — router por hash, todas las vistas, progreso, motor de preguntas y motor de voz.
- `data/cloud-practitioner.js` — banco de preguntas, dominios, frentes, tarjetas, teoría, palabras gatillo, trampas y guiones de audio.
- `sw.js` — service worker (offline, network-first).
- `manifest.webmanifest` + `icon.svg` — metadatos para instalar la app en el celular.

## Qué cambió (historial)

- **v1–v2:** banco inicial de 108 preguntas, 9 frentes, motor anti-repetición, chuleta y modo offline (PWA).
- **v3:** service worker *network-first* (los cambios se ven al instante con conexión).
- **v4:** sección **Aprender** (teoría por dominio), práctica por dominio, **examen real de 65** con cronómetro, +31 preguntas difíciles.
- **v5:** examen con rotación anti-repetición entre intentos y **barajado de opciones**; +40 preguntas incluyendo 16 casos de empresa.
- **v6:** **modo oscuro** y **exportar resultados** a `.md`.
- **v7:** barajado de opciones también en **Practicar**; el banco llega a 186 preguntas.
- **v8:** preguntas de **respuesta múltiple** (elegir 2) en Practicar y Examen.
- **v9:** +57 preguntas (IA/ML, analítica, dev tools, gobierno, híbrido/borde, bases de datos) y 6 frentes nuevos → **243 preguntas, 15 frentes**; corrección del orden de opciones en la revisión del examen.
- **v10:** sección **Escuchar** (5 audios en voz alta, offline).
- **v11:** **116 palabras gatillo** ("si el enunciado dice… piensa en…") en Repaso.
- **v12:** **trampas típicas del examen** en Repaso.

## Nota

Herramienta personal de estudio, no afiliada a AWS. Los nombres de servicios son marcas de Amazon Web Services.
