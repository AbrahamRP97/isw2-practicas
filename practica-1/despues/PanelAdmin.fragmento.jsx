// FRAGMENTO de frontend/src/pages/PanelAdmin.jsx  (DESPUÉS del refactor)

// Un estado por responsabilidad, con nombres que dicen qué guardan
const [reservaProcesandoId, setReservaProcesandoId] = useState(null)
const [contratoProcesandoId, setContratoProcesandoId] = useState(null)
const [propiedadCreada, setPropiedadCreada] = useState(false)
const [mensajeExito, setMensajeExito] = useState(null)

const handleCancelarContrato = async (id_contrato) => {
  setContratoProcesandoId(id_contrato)
  setError(null)
  // ...
}

<button
  onClick={() => handleAprobarReserva(r.id_reserva)}
  className="btn btn-exito btn-sm"
  disabled={reservaProcesandoId === r.id_reserva}
>
  {reservaProcesandoId === r.id_reserva ? '...' : 'Aprobar'}
</button>

disabled={contratoProcesandoId === c.id_contrato}
