const listaClientes = document.querySelector("#listaClientes");
const mensaje = document.querySelector("#mensaje");

const selectClienteAgregar = document.querySelector("#selectClienteAgregar");
const selectClienteEliminar = document.querySelector("#selectClienteEliminar");
const selectClienteEliminarRut = document.querySelector("#selectClienteEliminarRut");
const selectClienteEliminarAhorro = document.querySelector("#selectClienteEliminarAhorro");
const selectCuentaAhorroEliminar = document.querySelector("#selectCuentaAhorroEliminar");

let clientesCache = [];

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
}

function renderClientes(clientes) {
    if (clientes.length === 0) {
        listaClientes.innerHTML = "<p>No hay clientes para mostrar.</p>";
        return;
    }

    listaClientes.innerHTML = clientes.map((cliente) => `
        <article>
            <h3>${cliente.nombre} (${cliente.rut})</h3>
            <p>Cuenta RUT: ${cliente.cuentaRut ? `N° ${cliente.cuentaRut.numeroCuenta} - Saldo: $${cliente.cuentaRut.saldo.toLocaleString("es-CL")}` : "No tiene"}</p>
            <p>Cuentas de ahorro:</p>
            <ul>
                ${cliente.cuentasAhorro.length === 0
                    ? "<li>No tiene</li>"
                    : cliente.cuentasAhorro.map((a) => `<li>N° ${a.numeroCuenta} - Saldo: $${a.saldo.toLocaleString("es-CL")}</li>`).join("")}
            </ul>
        </article>
    `).join("");
}

function poblarSelects(clientes) {
    const opciones = clientes.map((c) => `<option value="${c.id}">${c.nombre} (${c.rut})</option>`).join("");
    selectClienteAgregar.innerHTML = opciones;
    selectClienteEliminar.innerHTML = opciones;
    selectClienteEliminarRut.innerHTML = opciones;
    selectClienteEliminarAhorro.innerHTML = opciones;
    poblarCuentasAhorro();
}

function poblarCuentasAhorro() {
    const clienteId = Number(selectClienteEliminarAhorro.value);
    const cliente = clientesCache.find((c) => c.id === clienteId);

    if (!cliente || cliente.cuentasAhorro.length === 0) {
        selectCuentaAhorroEliminar.innerHTML = "<option value=''>Sin cuentas de ahorro</option>";
        return;
    }

    selectCuentaAhorroEliminar.innerHTML = cliente.cuentasAhorro
        .map((a) => `<option value="${a.numeroCuenta}">N° ${a.numeroCuenta} - $${a.saldo.toLocaleString("es-CL")}</option>`)
        .join("");
}

async function cargarClientes() {
    const respuesta = await fetch("/api/clientes");
    clientesCache = await respuesta.json();
    renderClientes(clientesCache);
    poblarSelects(clientesCache);
}

async function cargarClientesConRut() {
    const respuesta = await fetch("/api/clientes/con-cuenta-rut");
    const clientes = await respuesta.json();
    renderClientes(clientes);
}

document.querySelector("#btnListarTodos").addEventListener("click", cargarClientes);
document.querySelector("#btnListarConRut").addEventListener("click", cargarClientesConRut);

selectClienteEliminarAhorro.addEventListener("change", poblarCuentasAhorro);

document.querySelector("#formNuevoCliente").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form));

    const respuesta = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();
    mostrarMensaje(resultado.mensaje);

    if (respuesta.ok) {
        form.reset();
        cargarClientes();
    }
});

document.querySelector("#formAgregarCuenta").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form));
    const ruta = datos.tipoCuenta === "rut" ? "cuenta-rut" : "cuenta-ahorro";

    const respuesta = await fetch(`/api/clientes/${datos.clienteId}/${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldoInicial: datos.saldoInicial })
    });
    const resultado = await respuesta.json();
    mostrarMensaje(resultado.mensaje);

    if (respuesta.ok) {
        form.reset();
        cargarClientes();
    }
});

document.querySelector("#formEliminarCliente").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form));

    const respuesta = await fetch(`/api/clientes/${datos.clienteId}`, { method: "DELETE" });
    const resultado = await respuesta.json();
    mostrarMensaje(resultado.mensaje);

    if (respuesta.ok) cargarClientes();
});

document.querySelector("#formEliminarRut").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form));

    const respuesta = await fetch(`/api/clientes/${datos.clienteId}/cuenta-rut`, { method: "DELETE" });
    const resultado = await respuesta.json();
    mostrarMensaje(resultado.mensaje);

    if (respuesta.ok) cargarClientes();
});

document.querySelector("#formEliminarAhorro").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const datos = Object.fromEntries(new FormData(form));

    const respuesta = await fetch(`/api/clientes/${datos.clienteId}/cuenta-ahorro/${datos.numeroCuenta}`, { method: "DELETE" });
    const resultado = await respuesta.json();
    mostrarMensaje(resultado.mensaje);

    if (respuesta.ok) cargarClientes();
});

cargarClientes();
