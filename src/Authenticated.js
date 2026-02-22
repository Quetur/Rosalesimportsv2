// Middleware para verificar sesión
export const isAuthenticated = (req, res, next) => {
    console,log("isAuthenticated", req.session.user);
  if (req.session && req.session.user) {
    return next();
  }
  // Si no está logueado, redirigir al login
  res.redirect("/"); 
};
