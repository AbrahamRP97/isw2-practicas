// FRAGMENTO de frontend/src/pages/PanelAdmin.jsx  (ANTES del refactor)

// Línea 29 y 45: nombres engañosos / genéricos
const [procesandoReserva, setProcesandoReserva] = useState(null)
const [exito, setExito] = useState(false)

// Línea ~364: ¡se guarda el id de un CONTRATO en el estado de "reserva"!
const handleCancelarContrato = async (id_contrato) => {
  setProcesandoReserva(id_contrato)
  setError(null)
  // ...
}

// Líneas ~691-694: botón de reservas
<button
  onClick={() => handleAprobarReserva(r.id_reserva)}
  className="btn btn-exito btn-sm"
  disabled={procesandoReserva === r.id_reserva}
>
  {procesandoReserva === r.id_reserva ? '...' : 'Aprobar'}
</button>

// Líneas ~768-770: botón de contratos, mismo estado
disabled={procesandoReserva === c.id_contrato}
