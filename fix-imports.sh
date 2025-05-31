#!/bin/bash

echo "🛠️ Corrigiendo rutas de imports rotas a rutas absolutas..."

# Cambiar rutas relativas de usuarios-accesos a absolutas
find src -type f -name "*.ts" -exec sed -i "s|from '../paquete-1-usuarios-accesos|from 'src/paquete-1-usuarios-accesos|g" {} +
find src -type f -name "*.ts" -exec sed -i "s|from \"../paquete-1-usuarios-accesos|from \"src/paquete-1-usuarios-accesos|g" {} +

# Cambiar rutas relativas de membresias a absolutas
find src -type f -name "*.ts" -exec sed -i "s|from '../membresias|from 'src/membresias|g" {} +
find src -type f -name "*.ts" -exec sed -i "s|from \"../membresias|from \"src/membresias|g" {} +

# También cubrimos rutas con ./
find src -type f -name "*.ts" -exec sed -i "s|from './paquete-1-usuarios-accesos|from 'src/paquete-1-usuarios-accesos|g" {} +
find src -type f -name "*.ts" -exec sed -i "s|from \"./paquete-1-usuarios-accesos|from \"src/paquete-1-usuarios-accesos|g" {} +

echo "✅ Rutas corregidas. Ahora podés ejecutar: npm run start:dev"
