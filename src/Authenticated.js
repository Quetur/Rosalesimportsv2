export const isAuthenticated = (req, res, next) => {
    // 1. Verificamos si la sesión existe (express-session la inicializó)
    // 2. Verificamos si el objeto user está dentro (el usuario se logueó)
    if (req.session && req.session.user) {
        console.log("Sesión válida para:", req.session.user.nombre);
        return next();
    }

    console.log("Sesión no encontrada o usuario no logueado. Redirigiendo...");
    res.redirect("/"); 
};