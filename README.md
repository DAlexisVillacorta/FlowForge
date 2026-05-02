# FlowForge

**Contabilidad inteligente para PyMEs argentinas.** Automatizá la clasificación de transacciones, conciliación bancaria y generación de reportes con inteligencia artificial.

## 🚀 Inicio rápido

### Requisitos

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **Docker** y Docker Compose ([descargar](https://www.docker.com/products/docker-desktop/))
- **npm** 9+ (viene con Node.js)

### Paso 1: Instalar dependencias

```bash
npm install
```

### Paso 2: Configurar variables de entorno

El archivo `.env` ya viene configurado para desarrollo local. Si necesitás personalizarlo:

```bash
cp .env.example .env
```

### Paso 3: Levantar la base de datos

```bash
docker compose up -d
```

Esto inicia PostgreSQL en `localhost:5432` con las credenciales del `.env`.

### Paso 4: Inicializar la base de datos

```bash
npm run db:setup
```

Este comando hace 3 cosas en orden:
1. `prisma generate` — Genera el cliente de Prisma
2. `prisma db push` — Crea las tablas en la base de datos
3. `tsx prisma/seed.ts` — Carga datos de ejemplo

### Paso 5: Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔐 Credenciales de prueba

Después de correr el seed, podés iniciar sesión con:

| Campo | Valor |
|-------|-------|
| **Email** | `martin.rodriguez@distribuidoranorte.com.ar` |
| **Contraseña** | `FlowForge123!` |

## 📋 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run db:generate` | Generar cliente de Prisma |
| `npm run db:push` | Sincronizar esquema con la DB |
| `npm run db:migrate` | Crear y aplicar migración |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run db:setup` | Generar + push + seed (todo en uno) |
| `npm run db:studio` | Abrir Prisma Studio (UI visual de la DB) |

## 🗄️ Base de datos

### Estructura

El esquema incluye las siguientes entidades:

- **User** / **Organization** — Usuarios y organizaciones (empresas)
- **BankAccount** — Cuentas bancarias (Galicia, BIND, etc.)
- **BankStatement** — Extractos bancarios subidos (PDF/CSV)
- **Transaction** — Transacciones clasificadas por IA
- **Invoice** — Facturas (A, B, C, notas de crédito/débito)
- **ReconciliationMatch** — Matches entre transacciones y facturas
- **ClassificationRule** — Reglas de clasificación automática
- **Report** — Reportes generados (conciliación, resumen, impositivo)

### Prisma Studio

Para ver y editar los datos visualmente:

```bash
npm run db:studio
```

Se abre en [http://localhost:5555](http://localhost:5555).

### Cambios en el esquema

Si modificás `prisma/schema.prisma`:

```bash
npm run db:migrate --name "nombre_del_cambio"
```

O para desarrollo rápido (sin historial de migraciones):

```bash
npm run db:push
```

## 🔧 API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/register` | POST | Registrar nuevo usuario |
| `/api/auth/[...nextauth]` | GET/POST | Autenticación NextAuth |
| `/api/dashboard` | GET | Estadísticas del dashboard |
| `/api/statements` | GET, POST | Listar/crear extractos bancarios |
| `/api/statements/[id]` | GET, PATCH, DELETE | Operar con un extracto |
| `/api/transactions` | GET, PATCH | Listar/actualizar transacciones |
| `/api/invoices` | GET, POST, PATCH | Listar/crear/actualizar facturas |
| `/api/reconciliation` | GET, POST, PATCH | Gestión de matches |
| `/api/reports` | GET, POST | Listar/generar reportes |
| `/api/rules` | GET, POST, PATCH, DELETE | Reglas de clasificación |
| `/api/bank-accounts` | GET, POST, DELETE | Cuentas bancarias |

## 🏗️ Stack tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL 16
- **ORM**: Prisma
- **Autenticación**: NextAuth.js (Credentials + Google OAuth)
- **Validación**: Zod
- **UI**: React 18 + Tailwind CSS + Framer Motion
- **Gráficos**: Recharts
- **Hashing**: bcryptjs

## 📁 Estructura del proyecto

```
FlowForge/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── (app)/             # Páginas protegidas (dashboard, upload, etc.)
│   │   ├── (auth)/            # Páginas de autenticación (login, register)
│   │   └── api/               # API Routes (backend)
│   ├── components/            # Componentes React
│   ├── hooks/                 # Custom hooks
│   ├── lib/
│   │   ├── auth/              # Configuración de NextAuth
│   │   ├── db/                # Cliente de Prisma
│   │   ├── validators/        # Schemas de Zod
│   │   └── mock-data.ts       # Datos mock (para desarrollo)
│   └── middleware.ts          # Protección de rutas
├── docker-compose.yml         # PostgreSQL para desarrollo
├── .env                       # Variables de entorno
└── package.json
```

## 🔒 Producción

Antes de desplegar:

1. **Cambiá las claves secretas** en `.env`:
   - `NEXTAUTH_SECRET` — Generá una con `openssl rand -base64 32`
   - `JWT_SECRET` — Generá otra diferente
   - `DATABASE_URL` — Usá una URL de PostgreSQL de producción

2. **Configurá Google OAuth** (opcional):
   - Creá credenciales en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Seteá `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

3. **Migraciones**:
   ```bash
   npm run db:migrate --name "initial"
   ```

4. **Build**:
   ```bash
   npm run build
   npm run start
   ```

### Deploy en Vercel

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
npm run build
```

## 🤝 Contribuir

1. Creá un branch: `git checkout -b feature/nueva-funcionalidad`
2. Hacé commit: `git commit -m "feat: nueva funcionalidad"`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Abrí un Pull Request

## 📄 Licencia

Private — Todos los derechos reservados.
