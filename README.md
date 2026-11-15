# MALOTX

**Cobra lo que te deben, sin el drama.**

Todos tenemos un amigo que "luego te paga". MALOTX convierte ese cobro incómodo
en una experiencia divertida y fácil: tú decides cómo y a quién cobrar, y
mandas el enlace por WhatsApp. Tu amigo lo abre sin crear cuenta y paga con
CoDi desde la app de su banco, por QR o con una solicitud directa a su celular.

El pago se confirma solo y en segundos: la deuda se marca como cobrada y nadie
tiene que mandar comprobantes. Puedes dividir una cuenta entre varios, cada
quien con su propio enlace y su monto.

Hecho con la API de pey sobre CoDi, sin comisiones ni cuentas nuevas: el dinero
llega directo a tu banco. La demo corre en modo de prueba y cada pago cobra
$0.01 MXN.

## Cómo funciona

1. Creas un cobro: nombre, monto, fecha límite opcional y un meme.
2. Eliges a quién cobrarle y cómo dividirlo: partes iguales o montos a mano.
3. Cada persona recibe su propio enlace, que mandas desde tu WhatsApp.
4. Quien debe abre el enlace y paga con CoDi: escanea el QR o recibe la
   solicitud en la app de su banco.
5. pey confirma el pago y la página cambia a "Cobrado." en segundos.

## Memes

Seis chihuahuas en `public/memes` (WebP, 1200 × 1200, sin metadatos), definidos
una sola vez en `src/content/memes.ts`: archivo, texto alternativo, texto por
defecto y posición del texto. El texto va encima de la imagen en estilo meme y
quien cobra lo puede cambiar (hasta 60 caracteres). La vista previa del enlace
se genera en el servidor con el meme y su texto.

## Stack

- Next.js (App Router), TypeScript y Tailwind CSS, en Vercel.
- Postgres en Neon.
- Pagos CoDi con la API de [pey](https://docs.pey.mx); webhooks firmados con
  Standard Webhooks.

## Desarrollo local

Requisitos: Node.js 26 y npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Con `DATABASE_URL` en `.env.local`, corre `npm run db:migrate` una vez. Abre
http://localhost:3000/entrar y entra con el `TEAM_SECRET` de tu `.env.local`.
La galería de pantallas con datos de prueba está en http://localhost:3000/dev/ui
(solo en desarrollo).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local |
| `npm run check` | Tipos y lint |
| `npm test` | Pruebas (con Postgres en memoria) |
| `npm run db:migrate` | Aplica las migraciones a `DATABASE_URL` |
| `npm run scan` | Busca secretos en el código |
| `npm run build` | Pruebas, migraciones (solo en producción) y build |

## Variables de entorno

Ver `.env.example`. Ningún valor real va en el repositorio.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (Neon, pooled) |
| `PEY_API_KEY` | Llave de la API de pey |
| `PEY_WEBHOOK_SECRET` | Secreto para verificar los webhooks de pey |
| `DEMO_MODE` | Cobra $0.01 por pago salvo que valga `false` |
| `TEAM_SECRET` | Clave del equipo para entrar en `/entrar` mientras no hay inicio de sesión por WhatsApp |

Los enlaces de cobro usan el dominio de producción que Vercel pone en
`VERCEL_PROJECT_PRODUCTION_URL`; en local usan `http://localhost:3000`.

## Seguridad

- Un cobro solo se marca pagado con un webhook de pey con firma válida o con la
  consulta de la transacción a pey, nunca por algo que mande el navegador.
- Cada webhook se procesa una sola vez.
- Cada persona recibe un enlace propio con un token aleatorio de 128 bits.
- Las sesiones guardan solo el hash del token. Entrar y crear cobros tienen
  límite por IP, y crear cobros también por usuario.
- La página que abre quien debe solo muestra su nombre de pila; nunca
  teléfonos ni cuentas bancarias.
- Cada commit y el historial completo pasan por un escáner de secretos.
