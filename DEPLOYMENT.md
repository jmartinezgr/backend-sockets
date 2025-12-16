# Guía de Deployment

## ✅ Estado del Proyecto

El proyecto está **listo para ser buildeado y desplegado**. Todos los errores de TypeScript han sido corregidos.

## 📦 Build

```bash
npm run build
```

Esto genera la carpeta `dist/` con todo el código compilado.

## 🚀 Producción

### Variables de entorno requeridas (.env):

```env
# PostgreSQL
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=tu_host
DB_PORT=5432
DB_NAME=tu_database
ENVIRONMENT=production

# MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database

# JWT Usuarios
JWT_SECRET=clave_super_segura_para_usuarios_cambiarla_en_produccion
JWT_EXPIRES_IN=24h

# JWT Sensores
JWT_SENSOR_SECRET=clave_super_segura_para_sensores_diferente_de_la_anterior

# Puerto
PORT=3000
```

### Comandos de producción:

```bash
# Build
npm run build

# Start en producción
npm run start:prod
```

## 🐳 Docker (Opcional)

Crear `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

Crear `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_SENSOR_SECRET=${JWT_SENSOR_SECRET}
      - ENVIRONMENT=production
    restart: unless-stopped
```

## ☁️ Deployment en Railway/Render/Heroku

### Railway:
1. Conecta tu repositorio de GitHub
2. Railway detectará automáticamente NestJS
3. Agrega las variables de entorno en el dashboard
4. Deploy automático

### Render:
1. Crea un nuevo Web Service
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start:prod`
4. Agrega variables de entorno
5. Deploy

### Heroku:
```bash
heroku create tu-app
heroku config:set DB_USERNAME=xxx DB_PASSWORD=xxx ...
git push heroku main
```

## 📊 Verificación después del deploy

1. **Health check**: GET `/` debería responder
2. **Auth**: POST `/auth/register` y `/auth/login`
3. **Sensores**: POST `/sensores` (con token de admin)
4. **WebSocket**: Conectar con cliente WebSocket a `wss://tu-dominio`
5. **Datos**: GET `/sensor-data` (con token de usuario)

## 🔧 Troubleshooting

### Error de conexión a PostgreSQL:
- Verifica que `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` sean correctos
- Asegúrate de que el firewall permita conexiones

### Error de conexión a MongoDB:
- Verifica que `MONGO_URI` sea correcta
- Para MongoDB Atlas: permite conexiones desde "0.0.0.0/0" en Network Access

### WebSocket no conecta:
- En producción con HTTPS, usa `wss://` en lugar de `ws://`
- Verifica que el servidor soporte WebSockets (algunos requieren configuración especial)

### Errores de CORS:
- En `websocket.gateaway.ts` ya está configurado `cors: { origin: '*' }`
- Para producción, cambia `'*'` por tu dominio específico

## 📝 Checklist pre-deployment

- [x] Código sin errores de TypeScript
- [x] Build exitoso (`npm run build`)
- [x] Variables de entorno configuradas
- [x] `ENVIRONMENT=production`
- [x] Secrets de JWT diferentes para usuarios y sensores
- [x] MongoDB URI válida
- [x] PostgreSQL URI válida
- [ ] Cambiar `synchronize: false` en producción (TypeORM)
- [ ] Configurar dominio y SSL
- [ ] Backup de base de datos

## ⚠️ Importante para producción

En [app.module.ts](src/app.module.ts), línea 30, considera cambiar:

```typescript
synchronize: config.get<string>('ENVIRONMENT') === 'development' ? true : false,
```

A:

```typescript
synchronize: false, // SIEMPRE false en producción
```

Y usar migraciones para cambios en la base de datos:

```bash
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
```

## 🎉 Proyecto listo

El código está pulido, sin errores de tipado, y listo para deployment en cualquier plataforma cloud.
