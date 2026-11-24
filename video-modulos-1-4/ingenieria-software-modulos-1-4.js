// =====================================================================
//  INGENIERÍA DE SOFTWARE II · Lo que aprendí (Módulos 1 a 4)
// =====================================================================

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// #region MÓDULO 1 · Clean Code: de "funciona" a "es profesional"

// --- 1.1 Nombres que revelan su intención ----------------------------
function obtener(l) {
  const r = [];
  for (const x of l) if (x[2] >= 65) r.push(x[0]);
  return r;
}

const NOTA_MINIMA_DE_APROBACION = 65;
const POSICION_NOMBRE = 0;
const POSICION_NOTA = 2;

const aproboLaClase = (registro) => registro[POSICION_NOTA] >= NOTA_MINIMA_DE_APROBACION;

function obtenerNombresDeAprobados(registros) {
  return registros.filter(aproboLaClase).map((registro) => registro[POSICION_NOMBRE]);
}

// --- 1.2 Funciones pequeñas y comentarios ----------------------------
// Sin los comentarios nadie sabe qué hace. Y si cambia la regla
// pero no el comentario, el comentario empieza a MENTIR.
function procesar(e) {
  // beca si nota >= 80, asistencia >= 90% y sin sanciones
  if (e.n >= 80 && e.a >= 0.9 && e.s === 0) return e.m * 0.5; // 50% de la matrícula
  return 0;
}

const NOTA_MINIMA_PARA_BECA = 80;
const ASISTENCIA_MINIMA_PARA_BECA = 0.9;
const PORCENTAJE_DE_BECA = 0.5;

const tieneBuenaNota = (e) => e.nota >= NOTA_MINIMA_PARA_BECA;
const tieneBuenaAsistencia = (e) => e.asistencia >= ASISTENCIA_MINIMA_PARA_BECA;
const noTieneSanciones = (e) => e.sanciones === 0;

function esElegibleParaBeca(estudiante) {
  return tieneBuenaNota(estudiante) && tieneBuenaAsistencia(estudiante) && noTieneSanciones(estudiante);
}

function calcularMontoDeBeca(estudiante) {
  if (!esElegibleParaBeca(estudiante)) return 0;
  return estudiante.matricula * PORCENTAJE_DE_BECA;
}

// --- 1.3 Code smells y deuda técnica ----------------------------------
const descuentoViejo = 0.05; // nadie lo usa
function precioFinalSucio(precio) {
  // return precio - precio * descuentoViejo;
  return precio * 0.15 + precio + 3;
  console.log("calculado"); // inalcanzable
}

// Constantes con nombre; lo viejo vive en el historial de Git, no aquí
const TASA_IMPUESTO = 0.15;
const COSTO_ENVIO = 3;
function calcularPrecioFinal(precio) {
  return precio + precio * TASA_IMPUESTO + COSTO_ENVIO;
}

// Complejidad condicional: "código flecha"
function puedeComprarSucio(usuario) {
  if (usuario) {
    if (usuario.activo) {
      if (usuario.saldo > 0) {
        return true;
      }
    }
  }
  return false;
}


function puedeComprar(usuario) {
  if (!usuario) return false;
  if (!usuario.activo) return false;
  return usuario.saldo > 0;
}

//MÓDULO 2 · Git y colaboración profesional
//
// Modelo mental:  working directory → git add → commit → git push
//                 Un commit es una FOTO del proyecto, no una lista de cambios sueltos.
//

// Commits que hablan (Conventional Commits):
//   feat: ...   fix: ...   refactor: ...   test: ...   docs: ...
//   "cambios"   "arreglos"   "ya funciona"   "final-final-v2"
//
// Code review con criterio — comentar el código, no a la persona:
//   "esto está mal"
//   "¿Podemos sacar el 0.15 a una constante? Así se busca con Ctrl+F"
//
// GitHub como plataforma de equipo: main protegida, PRs obligatorios,
// Issues para tareas y Actions que corren los tests en cada PR.



// MÓDULO 3 · SOLID y principios de diseño
class PedidoSucio {
  procesar(pedido) {
    let total = pedido.precio + pedido.precio * 0.15 + 3;
    if (pedido.cliente === "vip") total = total * 0.9;
    else if (pedido.cliente === "estudiante") total = total * 0.95;
    console.log(`Correo a ${pedido.email}: su total es ${total}`);
    return total;
  }
}
// O · Open/Closed
// L · Liskov
class SinDescuento {
  aplicar(total) { return total; }
}
class DescuentoPorcentual {
  constructor(porcentaje) { this.porcentaje = porcentaje; }
  aplicar(total) { return total * (1 - this.porcentaje); }
}

const DESCUENTO_VIP = 0.1;
const DESCUENTO_ESTUDIANTE = 0.05;
const DESCUENTOS_POR_CLIENTE = {
  regular: new SinDescuento(),
  vip: new DescuentoPorcentual(DESCUENTO_VIP),
  estudiante: new DescuentoPorcentual(DESCUENTO_ESTUDIANTE),
};

// I · Interface Segregation
class NotificadorConsola {
  enviar(destino, mensaje) { console.log(`   📧 ${destino}: ${mensaje}`); }
}

const redondear = (monto) => Math.round(monto * 100) / 100;

// S · Single Responsibility
// D · Dependency Inversion
class ProcesadorDePedidos {
  constructor(notificador, descuentos = DESCUENTOS_POR_CLIENTE) {
    this.notificador = notificador;
    this.descuentos = descuentos;
  }

  procesar(pedido) {
    const descuento = this.descuentos[pedido.cliente] ?? this.descuentos.regular;
    const total = redondear(descuento.aplicar(calcularPrecioFinal(pedido.precio)));
    this.notificador.enviar(pedido.email, `Su total es L ${total}`);
    return total;
  }
}


// MÓDULO 4 · Testing y TDD + Caso Knight Capital

// Pirámide de tests:
//E2E: pocos, lentos, frágiles
//Integración: algunos
//Unitarios: MUCHOS, rápidos, aislados

const ENVIO_GRATIS_DESDE = 500;
function calcularCostoDeEnvio(subtotal) {
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
}

class NotificadorEspia {
  constructor() { this.mensajes = []; }
  enviar(destino, mensaje) { this.mensajes.push({ destino, mensaje }); }
}



//  DEMOSTRACIÓN
console.log("\n=== Módulo 1 · antes | después ===");
const registros = [["Ana", "61911001", 90], ["Luis", "61911002", 64], ["Sofia", "61911003", 65]];
console.log("Aprobados:     ", obtener(registros), "|", obtenerNombresDeAprobados(registros));
const estudiante = { nota: 92, asistencia: 0.96, sanciones: 0, matricula: 4000 };
console.log("Beca:          ", procesar({ n: 92, a: 0.96, s: 0, m: 4000 }), "|", calcularMontoDeBeca(estudiante));
console.log("Precio final:  ", precioFinalSucio(100), "|", calcularPrecioFinal(100));
console.log("Puede comprar: ", puedeComprarSucio({ activo: true, saldo: 50 }), "|", puedeComprar({ activo: true, saldo: 50 }));

console.log("\n=== Módulo 3 · ProcesadorDePedidos ===");
const procesador = new ProcesadorDePedidos(new NotificadorConsola());
procesador.procesar({ precio: 100, cliente: "vip", email: "ana@correo.com" });
procesador.procesar({ precio: 100, cliente: "estudiante", email: "luis@correo.com" });

console.log("\n=== Módulo 4 · Suite de tests ===");


describe("Módulo 1 · Refactoring seguro: antes y después dan lo mismo", () => {
  test("nombres con intención", () => {
    assert.deepEqual(obtenerNombresDeAprobados(registros), obtener(registros));
  });

  test("beca: mismos resultados en todos los casos", () => {
    const casos = [
      { nota: 90, asistencia: 0.95, sanciones: 0, matricula: 4000 }, // aplica
      { nota: 75, asistencia: 0.95, sanciones: 0, matricula: 4000 }, // nota baja
      { nota: 90, asistencia: 0.8, sanciones: 0, matricula: 4000 },  // poca asistencia
      { nota: 90, asistencia: 0.95, sanciones: 1, matricula: 4000 }, // con sanción
    ];
    for (const e of casos) {
      const formatoViejo = { n: e.nota, a: e.asistencia, s: e.sanciones, m: e.matricula };
      assert.equal(calcularMontoDeBeca(e), procesar(formatoViejo));
    }
  });

  test("precio final y puedeComprar", () => {
    assert.equal(calcularPrecioFinal(100), precioFinalSucio(100));
    for (const u of [null, { activo: false, saldo: 9 }, { activo: true, saldo: 0 }, { activo: true, saldo: 5 }]) {
      assert.equal(puedeComprar(u), puedeComprarSucio(u));
    }
  });
});

describe("Módulo 3 · ProcesadorDePedidos (con doble de prueba)", () => {
  test("cliente VIP recibe 10% de descuento", () => {
    // Arrange
    const espia = new NotificadorEspia();
    const procesador = new ProcesadorDePedidos(espia);
    // Act
    const total = procesador.procesar({ precio: 100, cliente: "vip", email: "ana@correo.com" });
    // Assert
    assert.equal(total, 106.2);
  });

  test("notifica una sola vez al correo del cliente", () => {
    const espia = new NotificadorEspia();
    new ProcesadorDePedidos(espia).procesar({ precio: 100, cliente: "regular", email: "ana@correo.com" });
    assert.equal(espia.mensajes.length, 1);
    assert.equal(espia.mensajes[0].destino, "ana@correo.com");
  });

  test("cliente desconocido se trata como regular", () => {
    const total = new ProcesadorDePedidos(new NotificadorEspia())
      .procesar({ precio: 100, cliente: "otro", email: "x@correo.com" });
    assert.equal(total, 118);
  });

  test("Liskov: todo descuento devuelve un valor entre 0 y el total", () => {
    for (const descuento of Object.values(DESCUENTOS_POR_CLIENTE)) {
      const resultado = descuento.aplicar(100);
      assert.ok(resultado >= 0 && resultado <= 100);
    }
  });
});

describe("Módulo 4 · TDD: envío gratis desde L 500", () => {
  test("cobra envío si la compra es menor a 500", () => {
    assert.equal(calcularCostoDeEnvio(499.99), COSTO_ENVIO);
  });
  test("envío gratis exactamente en 500 (caso borde)", () => {
    assert.equal(calcularCostoDeEnvio(500), 0);
  });
  test("envío gratis arriba de 500", () => {
    assert.equal(calcularCostoDeEnvio(800), 0);
  });
});
