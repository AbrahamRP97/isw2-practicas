// ANTES: esta misma función estaba COPIADA en tres archivos
//   backend/src/routes/propiedades.js   (línea ~51)
//   backend/src/routes/perfil.js        (línea ~15)
//   backend/src/routes/transacciones.js (línea ~7)
async function usuarioDelToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// ...y una cuarta versión, reescrita dentro de backend/src/routes/admin.js
async function soloAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Inicia sesión como administrador' })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'Sesión inválida' })
  if (data.user.app_metadata?.es_admin !== true) {
    return res.status(403).json({ error: 'Solo el administrador de la plataforma puede ver esto' })
  }
  req.admin = data.user
  next()
}
