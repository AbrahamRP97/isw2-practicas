const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const BD = [];

function reservar(c, f, h, n, tel, pago) {
  if (h < 6 || h + n > 22) return "error horario";
  for (const r of BD) {
    if (r.c === c && r.f === f && h < r.h + r.n && r.h < h + n) return "error ocupada";
  }
  let total = 0;
  for (let i = h; i < h + n; i++) total += i >= 18 ? 800 : 600;
  switch (pago) {
    case "efectivo": break;
    case "tarjeta": total = total * 1.035; break;
    case "transferencia": total = total + 10; break;
  }
  BD.push({ c, f, h, n, tel, total });
  console.log(`   [WhatsApp] a ${tel}: reserva confirmada por L ${total}`);
  return total;
}

const HORA_APERTURA = 6;
const HORA_CIERRE = 22;
const HORA_INICIO_NOCTURNA = 18;
const PRECIO_HORA_DIURNA = 600;
const PRECIO_HORA_NOCTURNA = 800;

class ErrorDeReserva extends Error {}

function estaDentroDelHorario(horaInicio, horas) {
  return horas >= 1 && horaInicio >= HORA_APERTURA && horaInicio + horas <= HORA_CIERRE;
}

function seCruzan(a, b) {
  return a.horaInicio < b.horaInicio + b.horas && b.horaInicio < a.horaInicio + a.horas;
}

function calcularPrecioBase(horaInicio, horas) {
  let precio = 0;
  for (let hora = horaInicio; hora < horaInicio + horas; hora++) {
    precio += hora >= HORA_INICIO_NOCTURNA ? PRECIO_HORA_NOCTURNA : PRECIO_HORA_DIURNA;
  }
  return precio;
}

function crearReserva(solicitud, reservasDelDia) {
  if (!estaDentroDelHorario(solicitud.horaInicio, solicitud.horas)) {
    throw new ErrorDeReserva("La cancha abre de 6:00 a 22:00");
  }
  if (reservasDelDia.some((reserva) => seCruzan(solicitud, reserva))) {
    throw new ErrorDeReserva("Ese horario ya está ocupado");
  }
  return { ...solicitud, precioBase: calcularPrecioBase(solicitud.horaInicio, solicitud.horas) };
}

const RECARGO_TARJETA = 0.035;
const COMISION_TRANSFERENCIA = 10;
const redondear = (monto) => Math.round(monto * 100) / 100;

const METODOS_DE_PAGO = {
  efectivo: { calcularTotal: (base) => base },
  tarjeta: { calcularTotal: (base) => redondear(base * (1 + RECARGO_TARJETA)) },
  transferencia: { calcularTotal: (base) => base + COMISION_TRANSFERENCIA },
};

// Puerto que necesita el caso de uso: repositorio.reservasDe(cancha, fecha) y repositorio.guardar(reserva)
function crearReservarCancha({ repositorio, metodosDePago, eventos }) {
  return async function reservarCancha(solicitud) {
    const reservasDelDia = await repositorio.reservasDe(solicitud.cancha, solicitud.fecha);
    const reserva = crearReserva(solicitud, reservasDelDia);

    const metodo = metodosDePago[solicitud.metodoPago];
    if (!metodo) throw new ErrorDeReserva(`Método de pago no aceptado: ${solicitud.metodoPago}`);
    reserva.total = metodo.calcularTotal(reserva.precioBase);

    await repositorio.guardar(reserva);
    eventos.publicar("reservaConfirmada", reserva);
    return reserva;
  };
}

function crearEventos() {
  const suscriptores = {};
  return {
    suscribir(evento, alOcurrir) {
      (suscriptores[evento] ??= []).push(alOcurrir);
    },
    publicar(evento, datos) {
      for (const alOcurrir of suscriptores[evento] ?? []) alOcurrir(datos);
    },
  };
}

function repoMemoria() {
  const reservas = [];
  return {
    reservasDe: async (cancha, fecha) => reservas.filter((r) => r.cancha === cancha && r.fecha === fecha),
    guardar: async (reserva) => { reservas.push(reserva); },
  };
}

function repoSupabase() {
  const tablaReservas = [];
  const aFila = (r) => ({ cancha_id: r.cancha, fecha: r.fecha, hora_inicio: r.horaInicio, horas: r.horas, telefono: r.telefono, total: r.total });
  const aReserva = (f) => ({ cancha: f.cancha_id, fecha: f.fecha, horaInicio: f.hora_inicio, horas: f.horas, telefono: f.telefono, total: f.total });
  return {
    reservasDe: async (cancha, fecha) =>
      tablaReservas.filter((f) => f.cancha_id === cancha && f.fecha === fecha).map(aReserva),
    guardar: async (reserva) => { tablaReservas.push(aFila(reserva)); },
  };
}

const ApiWhatsAppExterna = {
  sendTemplate(payload) {
    console.log(`   WhatsApp -> ${payload.recipient.phone_number}: ${payload.template.body}`);
  },
};

function adaptadorWhatsApp(api) {
  return {
    enviar: (telefono, texto) =>
      api.sendTemplate({ recipient: { phone_number: `+504${telefono}` }, template: { body: texto } }),
  };
}

function crearNotificador(canal) {
  if (canal === "whatsapp") return adaptadorWhatsApp(ApiWhatsAppExterna);
  if (canal === "consola") return { enviar: (tel, texto) => console.log(`   Consola -> ${tel}: ${texto}`) };
  if (canal === "silencioso") return { enviar: () => {} };
  throw new Error(`Canal desconocido: ${canal}`);
}

function armarSistema({ repositorio, canal }) {
  const eventos = crearEventos();
  const notificador = crearNotificador(canal);
  const reporteDelDia = { reservas: 0, ingresos: 0 };

  eventos.suscribir("reservaConfirmada", (r) =>
    notificador.enviar(r.telefono, `Cancha ${r.cancha} reservada el ${r.fecha} a las ${r.horaInicio}:00. Total L ${r.total}`));
  eventos.suscribir("reservaConfirmada", (r) => {
    reporteDelDia.reservas++;
    reporteDelDia.ingresos += r.total;
  });

  const reservarCancha = crearReservarCancha({ repositorio, metodosDePago: METODOS_DE_PAGO, eventos });
  return { reservarCancha, reporteDelDia };
}

async function demo() {
  console.log("\n=== ANTES ===");
  console.log("Total:", reservar(1, "2026-11-28", 19, 2, "99887766", "tarjeta"));

  console.log("\n=== DESPUÉS ===");
  const { reservarCancha, reporteDelDia } = armarSistema({ repositorio: repoSupabase(), canal: "whatsapp" });

  await reservarCancha({ cancha: 1, fecha: "2026-11-28", horaInicio: 19, horas: 2, telefono: "99887766", metodoPago: "tarjeta" });
  await reservarCancha({ cancha: 1, fecha: "2026-11-28", horaInicio: 16, horas: 2, telefono: "33445566", metodoPago: "efectivo" });

  try {
    await reservarCancha({ cancha: 1, fecha: "2026-11-28", horaInicio: 20, horas: 1, telefono: "22113344", metodoPago: "efectivo" });
  } catch (error) {
    console.log("   Rechazada:", error.message);
  }
  console.log("   Reporte del día:", reporteDelDia);
  console.log("\n=== PRUEBAS ===");
}

demo();

const solicitud = (cambios = {}) => ({
  cancha: 1, fecha: "2026-11-28", horaInicio: 19, horas: 2, telefono: "99887766", metodoPago: "efectivo", ...cambios,
});

describe("Dominio", () => {
  test("cobra tarifa nocturna desde las 18:00", () => {
    assert.equal(calcularPrecioBase(17, 2), PRECIO_HORA_DIURNA + PRECIO_HORA_NOCTURNA);
  });
  test("rechaza horarios fuera de 6:00 a 22:00", () => {
    assert.throws(() => crearReserva(solicitud({ horaInicio: 21, horas: 2 }), []), ErrorDeReserva);
  });
  test("rechaza un horario que se cruza con otra reserva", () => {
    assert.throws(() => crearReserva(solicitud({ horaInicio: 20 }), [solicitud()]), /ocupado/);
  });
  test("permite reservar justo cuando termina la anterior", () => {
    assert.doesNotThrow(() => crearReserva(solicitud({ horaInicio: 21, horas: 1 }), [solicitud()]));
  });
});

describe("Strategy", () => {
  test("tarjeta suma 3.5% y transferencia suma L 10", () => {
    assert.equal(METODOS_DE_PAGO.tarjeta.calcularTotal(1000), 1035);
    assert.equal(METODOS_DE_PAGO.transferencia.calcularTotal(1000), 1010);
  });
});

describe("Repository: mismo caso de uso, dos adaptadores", () => {
  for (const [nombre, crearRepo] of [["Memoria", repoMemoria], ["Supabase", repoSupabase]]) {
    test(`con repo${nombre}: guarda y luego detecta el cruce`, async () => {
      const { reservarCancha } = armarSistema({ repositorio: crearRepo(), canal: "silencioso" });

      const reserva = await reservarCancha(solicitud({ metodoPago: "tarjeta" }));

      assert.equal(reserva.total, 1656);
      await assert.rejects(reservarCancha(solicitud({ horaInicio: 20, horas: 1 })), /ocupado/);
    });
  }
});

describe("Observer, Factory y Adapter", () => {
  test("Observer: el reporte del día se entera de cada reserva", async () => {
    const { reservarCancha, reporteDelDia } = armarSistema({ repositorio: repoMemoria(), canal: "silencioso" });
    await reservarCancha(solicitud());
    assert.deepEqual(reporteDelDia, { reservas: 1, ingresos: 1600 });
  });
  test("Factory: rechaza un canal que no existe", () => {
    assert.throws(() => crearNotificador("paloma-mensajera"), /Canal desconocido/);
  });
  test("Adapter: traduce enviar(tel, texto) al formato de la API externa", () => {
    const llamadas = [];
    const apiFalsa = { sendTemplate: (payload) => llamadas.push(payload) };
    adaptadorWhatsApp(apiFalsa).enviar("99887766", "Hola");
    assert.equal(llamadas[0].recipient.phone_number, "+50499887766");
  });
});