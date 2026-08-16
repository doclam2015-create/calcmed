# CalcMed

Aplicación web progresiva (PWA) de calculadoras, scores, algoritmos y referencias clínicas en español. Está diseñada para profesionales de la salud y puede instalarse en iPhone y iPad desde Safari.

## Qué incluye

- Catálogo clínico completo organizado en 25 categorías, basado en las referencias visuales del proyecto.
- Búsqueda por nombre, sigla y especialidad.
- Menú lateral con acceso a todas las herramientas, categorías, favoritos y preferencias.
- Calculadoras interactivas con unidades, fórmula, interpretación y advertencias.
- Scores interactivos con componentes y puntuación total.
- Fichas estructuradas para algoritmos, criterios y tablas de consulta.
- Favoritos, historial, tema oscuro y vista compacta guardados en el dispositivo.
- Diseño adaptable para escritorio, iPhone y iPad.
- Manifiesto PWA, service worker e iconos para instalación en pantalla de inicio.
- Tarjeta social de CalcMed para enlaces compartidos.

## Fuentes clínicas

CalcMed prioriza organismos, sociedades y guías primarias, entre ellas CDC, OMS, ACOG/AAP, KDIGO, AASLD y NICE. Cada calculadora interactiva incluye su fórmula, alcance y advertencias. Los intervalos, puntos de corte y protocolos que dependen de edad, método, versión o institución se identifican como tales.

CalcMed es una ayuda para cálculo y consulta. No diagnostica, no prescribe y no reemplaza el juicio clínico, la verificación de unidades ni los protocolos institucionales.

## Requisitos

- Node.js 22.13 o posterior
- npm 10 o posterior

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Compilación

```bash
npm run build
```

## Subir a GitHub

1. Crea un repositorio vacío llamado `calcmed` en GitHub.
2. Desde esta carpeta ejecuta:

```bash
git init
git add .
git commit -m "Primera versión de CalcMed"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/calcmed.git
git push -u origin main
```

No subas `node_modules`, `.vinext`, `.wrangler` ni `dist`; se generan automáticamente y ya están contemplados en `.gitignore`.

## Instalar en iPhone o iPad

1. Publica la app en un servicio HTTPS compatible.
2. Abre la URL en Safari.
3. Toca **Compartir**.
4. Elige **Agregar a pantalla de inicio**.
5. Confirma **Agregar**.

CalcMed se abrirá en modo independiente y conservará favoritos y preferencias en ese dispositivo.

## Estructura principal

- `app/clinical-app.tsx`: catálogo, cálculos, scores e interacciones.
- `app/globals.css`: sistema visual y diseño adaptable.
- `app/layout.tsx`: metadatos, PWA y tarjeta social.
- `public/manifest.webmanifest`: configuración instalable.
- `public/sw.js`: disponibilidad local y caché PWA.
- `public/icon-*.png`: iconos de la aplicación.
- `public/og.png`: imagen para enlaces compartidos.

## Privacidad

La aplicación no solicita registro ni contiene campos para información identificable de pacientes. Favoritos, historial y preferencias se guardan únicamente en el navegador del dispositivo mediante almacenamiento local.

## Licencia y revisión clínica

Antes de una distribución asistencial o comercial, define una licencia de software y establece una revisión clínica formal con control de versiones, responsable editorial y calendario de actualización de guías.
