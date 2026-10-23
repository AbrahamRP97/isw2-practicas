# Práctica 1 · Diagnóstico de smells + primer refactor

**Proyecto analizado:** RentaFácil HN (plataforma de alquileres en Honduras).
**Stack:** React + Vite (frontend), Node/Express (backend), Supabase (PostgreSQL, Auth, Storage).

## 🔍 Diagnóstico: 3 "nombres criminales"

| # | Nombre original | Archivo | Tipo de smell | Por qué es un problema |
|---|-----------------|---------|---------------|------------------------|
| 1 | `procesandoReserva` | `PanelAdmin.jsx` (línea 29) | Nombre engañoso | Se llama "reserva", pero también guardaba el id de un **contrato** (`handleCancelarContrato` hacía `setProcesandoReserva(id_contrato)`). Un mismo estado servía para dos cosas distintas. |
| 2 | `exito` / `exitoEdicion` | `PanelAdmin.jsx` (líneas 45 y 58) | Nombre genérico | "Éxito" no dice de qué. Uno es un booleano de "propiedad creada"; el otro es un texto con un mensaje. Nombres casi iguales para cosas con tipos distintos. |
| 3 | `DetallePropiedades` | `pages/DetallePropiedades.jsx`, `main.jsx` | Nombre engañoso (plural) | La página muestra **una** propiedad; el plural sugiere una lista y rompe la convención del resto del proyecto (`Propiedades` = lista, `DetallePropiedad` = una). |

### Otros smells encontrados (no corregidos en esta práctica)

- Nombres de una letra (`r`, `p`, `c`) en callbacks de `PanelAdmin.jsx` (~14 usos).
- `datos` usado para dos formularios distintos en `MisReservas.jsx` (≈ líneas 120 y 234).
- El tope de L10,000 en efectivo y el cálculo de comisiones existen tanto en el frontend como en SQL (duplicación en capas).

## 🔁 Smell de código duplicado

`usuarioDelToken(req)` estaba copiada **idéntica en 3 archivos** (`propiedades.js`, `perfil.js`, `transacciones.js`) y reescrita en línea dentro de `soloAdmin` (`admin.js`). Cuatro copias de lógica de **autenticación**.

## ❓ ¿Por qué "código duplicado" es más peligroso que "código feo"?

El código feo molesta, pero **funciona de forma consistente** y está en un solo lugar: se arregla una vez. El código duplicado es peligroso porque **la misma regla vive en varios sitios** y cada copia puede evolucionar distinto. Si hay que cambiar algo (por ejemplo, cómo se valida el token), hay que acordarse de editar las 4 copias; si se olvida una, aparece un bug que solo ocurre en *esa* ruta, difícil de rastrear.
Y es especialmente grave cuando la duplicación está en **seguridad**: una copia desactualizada puede dejar una ruta menos protegida que las demás. En RentaFácil, un cambio en la validación del token habría tenido que replicarse en `propiedades`, `perfil`, `transacciones` y `admin`.

## ✅ Refactor aplicado

| Cambio | Antes | Después |
|--------|-------|---------|
| Estado de carga de reservas | `procesandoReserva` | `reservaProcesandoId` |
| Estado de carga de contratos | (compartía `procesandoReserva`) | `contratoProcesandoId` (estado propio) |
| Éxito al crear propiedad | `exito` | `propiedadCreada` |
| Mensaje de éxito general | `exitoEdicion` | `mensajeExito` |
| Página de detalle | `DetallePropiedades` | `DetallePropiedad` |
| Autenticación duplicada ×4 | 3 copias de `usuarioDelToken` + 1 inline en `soloAdmin` | un único módulo `backend/src/utils/auth.js` (`usuarioDelToken`, `soloAdmin`) |

## 🧪 Verificación (el refactor no cambió el comportamiento)

- **Backend:** las rutas (`propiedades`, `perfil`, `transacciones`, `admin`) se ejecutaron con un Supabase simulado antes y después; las respuestas fueron idénticas.
- **Frontend:** 19 verificaciones de interfaz (jsdom) pasaron después del cambio.
- **Bug real descubierto gracias al renombrado:** con el estado compartido, procesar un contrato dejaba deshabilitado el botón "Aprobar" de una reserva cuando ambos ids coincidían.
  - ANTES: botón *Aprobar* deshabilitado = `true` (incorrecto)
  - DESPUÉS: botón *Aprobar* deshabilitado = `false` (correcto)

## 📚 Aprendizajes

- Un nombre engañoso no es solo estético: ocultaba un bug real.
- Extraer la duplicación a un solo módulo reduce el riesgo, sobre todo en código de seguridad.
- Refactorizar es cambiar la estructura **sin cambiar el comportamiento**, y por eso hay que comprobarlo con pruebas.
- Herramientas de IA me ayudaron a localizar los smells y aplicar el refactor; las decisiones y la verificación las revisé yo.

## 📂 Antes vs Después

Ver [`antes/`](./antes) y [`despues/`](./despues). Son fragmentos reales del proyecto, no archivos completos.
