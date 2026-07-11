# BancoEstado - Clientes y Cuentas (Actividad 11)

Servidor Node/Express que administra clientes con cuenta RUT y cuentas de AHORRO, persistiendo los datos en un archivo JSON (`data/clientes.json`).

Regla de negocio: cada cliente puede tener como máximo **una** cuenta RUT y **varias** cuentas de AHORRO, pero nunca puede quedar sin ninguna de las dos.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start       # node app.js
npm run dev     # con nodemon (reinicio automático)
```

El servidor queda disponible en `http://localhost:3000`. Ahí mismo se sirve el frontend (`public/index.html`) para que los ejecutivos gestionen clientes y cuentas.

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/clientes` | Lista todos los clientes y sus cuentas |
| GET | `/api/clientes/con-cuenta-rut` | Lista solo los clientes que tienen cuenta RUT |
| POST | `/api/clientes` | Crea un cliente nuevo junto con su primera cuenta (`{ nombre, rut, tipoCuenta: "RUT"\|"AHORRO", saldoInicial }`) |
| POST | `/api/clientes/:id/cuenta-rut` | Agrega cuenta RUT a un cliente existente (falla si ya tiene una) |
| POST | `/api/clientes/:id/cuenta-ahorro` | Agrega una cuenta de ahorro a un cliente existente |
| DELETE | `/api/clientes/:id` | Elimina el cliente y todas sus cuentas |
| DELETE | `/api/clientes/:id/cuenta-rut` | Elimina la cuenta RUT del cliente (falla si lo dejaría sin cuentas) |
| DELETE | `/api/clientes/:id/cuenta-ahorro/:numeroCuenta` | Elimina una cuenta de ahorro puntual (falla si lo dejaría sin cuentas) |

## Estructura

```
app.js               servidor Express y lógica de negocio
data/clientes.json   almacenamiento de clientes y cuentas
public/index.html    interfaz para los ejecutivos
public/js/main.js    llamadas fetch a la API
public/css/style.css estilos
```
