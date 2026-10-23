import supabase from '../db.js'

// Devuelve el usuario de Supabase dueño del token "Authorization: Bearer ..." de la petición,
// o null si no hay token o no es válido. Es la ÚNICA implementación: todas las rutas que
// necesitan saber quién hace la petición la importan desde aquí.
export async function usuarioDelToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// Middleware: solo deja pasar al administrador de la plataforma.
// El rol vive en app_metadata, que únicamente se puede modificar desde Supabase
// (ver hacer_admin.sql). Un usuario NO puede asignárselo desde la página web.
export async function soloAdmin(req, res, next) {
  const user = await usuarioDelToken(req)
  if (!user) return res.status(401).json({ error: 'Inicia sesión como administrador' })
  if (user.app_metadata?.es_admin !== true) {
    return res.status(403).json({ error: 'Solo el administrador de la plataforma puede ver esto' })
  }
  req.admin = user
  next()
}
