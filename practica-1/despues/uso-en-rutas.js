// DESPUÉS: las rutas importan la lógica compartida en vez de copiarla
// backend/src/routes/propiedades.js, perfil.js y transacciones.js
import { usuarioDelToken } from '../utils/auth.js'

// backend/src/routes/admin.js
import { soloAdmin } from '../utils/auth.js'
router.use(soloAdmin)
