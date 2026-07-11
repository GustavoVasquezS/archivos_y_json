const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const clientesPath = path.join(__dirname, "data", "clientes.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function leerClientes() {
    if (!fs.existsSync(clientesPath)) {
        return [];
    }
    const data = fs.readFileSync(clientesPath, "utf8");
    return JSON.parse(data);
}

function guardarClientes(clientes) {
    fs.writeFileSync(clientesPath, JSON.stringify(clientes, null, 2));
}

function siguienteIdCliente(clientes) {
    return clientes.reduce((max, c) => Math.max(max, c.id), 0) + 1;
}

function siguienteNumeroCuenta(clientes, prefijo) {
    const numeros = clientes.flatMap((c) => {
        const rut = c.cuentaRut ? [c.cuentaRut.numeroCuenta] : [];
        const ahorro = c.cuentasAhorro.map((a) => a.numeroCuenta);
        return [...rut, ...ahorro];
    }).filter((n) => Math.floor(n / 1000000) === prefijo);

    const base = prefijo * 1000000;
    return numeros.length ? Math.max(...numeros) + 1 : base + 1;
}

function buscarCliente(clientes, id) {
    return clientes.find((c) => c.id === Number(id));
}

// 1. Listar todos los clientes y sus cuentas
app.get("/api/clientes", (req, res) => {
    res.json(leerClientes());
});

// 2. Listar todos los clientes con cuenta RUT
app.get("/api/clientes/con-cuenta-rut", (req, res) => {
    const clientes = leerClientes().filter((c) => c.cuentaRut !== null);
    res.json(clientes);
});

// 3 y 4. Agregar cliente nuevo + Cuenta RUT o + Cuenta de AHORRO
app.post("/api/clientes", (req, res) => {
    const { nombre, rut, tipoCuenta, saldoInicial } = req.body;

    if (!nombre || !rut || !tipoCuenta) {
        return res.status(400).json({ mensaje: "nombre, rut y tipoCuenta son obligatorios" });
    }
    if (!["RUT", "AHORRO"].includes(tipoCuenta)) {
        return res.status(400).json({ mensaje: "tipoCuenta debe ser 'RUT' o 'AHORRO'" });
    }

    const clientes = leerClientes();

    if (clientes.some((c) => c.rut === rut)) {
        return res.status(409).json({ mensaje: "Ya existe un cliente con ese RUT" });
    }

    const saldo = Number(saldoInicial) || 0;
    const nuevoCliente = {
        id: siguienteIdCliente(clientes),
        nombre,
        rut,
        cuentaRut: null,
        cuentasAhorro: []
    };

    if (tipoCuenta === "RUT") {
        nuevoCliente.cuentaRut = { numeroCuenta: siguienteNumeroCuenta(clientes, 1), saldo };
    } else {
        nuevoCliente.cuentasAhorro.push({ numeroCuenta: siguienteNumeroCuenta(clientes, 2), saldo });
    }

    clientes.push(nuevoCliente);
    guardarClientes(clientes);

    res.status(201).json({ mensaje: "Cliente creado", cliente: nuevoCliente });
});

// 5. Agregar cuenta RUT a cliente existente
app.post("/api/clientes/:id/cuenta-rut", (req, res) => {
    const clientes = leerClientes();
    const cliente = buscarCliente(clientes, req.params.id);

    if (!cliente) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    if (cliente.cuentaRut !== null) {
        return res.status(409).json({ mensaje: "El cliente ya tiene una cuenta RUT" });
    }

    const saldo = Number(req.body.saldoInicial) || 0;
    cliente.cuentaRut = { numeroCuenta: siguienteNumeroCuenta(clientes, 1), saldo };
    guardarClientes(clientes);

    res.status(201).json({ mensaje: "Cuenta RUT agregada", cliente });
});

// 6. Agregar cuenta de AHORRO a cliente existente
app.post("/api/clientes/:id/cuenta-ahorro", (req, res) => {
    const clientes = leerClientes();
    const cliente = buscarCliente(clientes, req.params.id);

    if (!cliente) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const saldo = Number(req.body.saldoInicial) || 0;
    cliente.cuentasAhorro.push({ numeroCuenta: siguienteNumeroCuenta(clientes, 2), saldo });
    guardarClientes(clientes);

    res.status(201).json({ mensaje: "Cuenta de ahorro agregada", cliente });
});

// 7. Eliminar cliente y todas sus cuentas
app.delete("/api/clientes/:id", (req, res) => {
    const clientes = leerClientes();
    const cliente = buscarCliente(clientes, req.params.id);

    if (!cliente) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const restantes = clientes.filter((c) => c.id !== cliente.id);
    guardarClientes(restantes);

    res.json({ mensaje: "Cliente y todas sus cuentas eliminados" });
});

// 8. Eliminar cuenta RUT de cliente
app.delete("/api/clientes/:id/cuenta-rut", (req, res) => {
    const clientes = leerClientes();
    const cliente = buscarCliente(clientes, req.params.id);

    if (!cliente) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    if (cliente.cuentaRut === null) {
        return res.status(404).json({ mensaje: "El cliente no tiene cuenta RUT" });
    }
    if (cliente.cuentasAhorro.length === 0) {
        return res.status(409).json({
            mensaje: "No se puede eliminar: el cliente quedaría sin cuenta RUT ni cuenta de AHORRO"
        });
    }

    cliente.cuentaRut = null;
    guardarClientes(clientes);

    res.json({ mensaje: "Cuenta RUT eliminada", cliente });
});

// 9. Eliminar cuenta de AHORRO de cliente
app.delete("/api/clientes/:id/cuenta-ahorro/:numeroCuenta", (req, res) => {
    const clientes = leerClientes();
    const cliente = buscarCliente(clientes, req.params.id);

    if (!cliente) {
        return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    const numeroCuenta = Number(req.params.numeroCuenta);
    const existe = cliente.cuentasAhorro.some((a) => a.numeroCuenta === numeroCuenta);
    if (!existe) {
        return res.status(404).json({ mensaje: "Cuenta de ahorro no encontrada" });
    }
    if (cliente.cuentaRut === null && cliente.cuentasAhorro.length === 1) {
        return res.status(409).json({
            mensaje: "No se puede eliminar: el cliente quedaría sin cuenta RUT ni cuenta de AHORRO"
        });
    }

    cliente.cuentasAhorro = cliente.cuentasAhorro.filter((a) => a.numeroCuenta !== numeroCuenta);
    guardarClientes(clientes);

    res.json({ mensaje: "Cuenta de ahorro eliminada", cliente });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
