// Genera public/manual-quiniela-liga-mx.pdf a partir de la pantalla "Cómo se juega" (modo ?imprimir),
// con los mismos colores de la app. Requiere el front corriendo (npm run dev) y Chrome o Edge instalados.
//   npm run pdf                      -> usa http://localhost:5173
//   URL_APP=http://otra:puerto npm run pdf
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const base = process.env.URL_APP ?? 'http://localhost:5173'
const salida = resolve('public/manual-quiniela-liga-mx.pdf')

const candidatos = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const navegador = candidatos.find((c) => existsSync(c))
if (!navegador) {
  console.error('No encontré Chrome ni Edge. Indica la ruta con la variable CHROME.')
  process.exit(1)
}

execFileSync(
  navegador,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=10000',
    `--print-to-pdf=${salida}`,
    `${base}/como-se-juega?imprimir`,
  ],
  { stdio: 'inherit' },
)

console.log(`PDF listo: ${salida} (${Math.round(statSync(salida).size / 1024)} KB)`)
