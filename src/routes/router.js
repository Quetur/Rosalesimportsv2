import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import pool from "../../db.js";
import { promisify } from "util";
//import AWS from "aws-sdk";
//import fs from "fs";
import bcryptjs from "bcryptjs";


// ingreso
router.get('/signin', (req, res) => {
    console.log("get signin");
    res.render("auth/signin", { 
        title: 'Acceso - Tienda ES6',
        hideSidebar: true // <--- Esta variable controla la visibilidad
    });
});



router.post("/login", async (req, res, next) => {
  console.log("post /login body:", req.mdni, req.pass); // Log de entrada para diagnóstico inicial
  const { dni, pass } = req.body;
  console.log("DNI:", dni, "Password:", pass ? "********" : "No proporcionado"); // No mostrar el password real en los logs 

  // 1. Validación de campos vacíos
  if (!dni || !pass) {
    return res.render("auth/signin", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "Ingrese un usuario y password",
      alertIcon: "info",
      showConfirmButton: true,
      timer: false,
      ruta: "",
    });
  }

  try {
    // 2. Consulta a la base de datos
    const [results] = await pool.query("SELECT * FROM usuario WHERE dni = ?", [dni]);
    const user = results[0];
    console.log("Usuario encontrado:", user ? user.dni : "No encontrado"); // Log para verificar si se encontró el usuario
    // 3. Verificación de existencia y password
    if (!user || !(await bcryptjs.compare(pass, user.pass))) {
      console.log("Error de autenticación: Usuario no encontrado o contraseña incorrecta"); // Log específico para fallo de autenticación
      return res.render("auth/signin", {
        alert: true,
        alertTitle: "Error",
        alertMessage: "Usuario o password incorrectos",
        alertIcon: "error",
        showConfirmButton: true,
        timer: 10000,
        ruta: "auth/signin",
      });
    }

    // 4. Generación de Token
    console.log("JWT_SECRETO:", process.env.JWT_SECRETO);
    const token = jwt.sign({ id: user.dni }, process.env.JWT_SECRETO);
    console.log("Token generado:", token); // Log para verificar la generación del token
    console.log("Usuario autenticado:", { dni: user.dni, nombre: user.nombre, apellido: "", logo: "" }); // Log para confirmar autenticación exitosa
    // 5. Renderizado de éxito
    res.render("auth/profile", {
      alert: true,
      alertTitle: "Bienvenido",
      alertMessage: "¡Ingreso exitoso!",
      alertIcon: "success", // Cambiado de error a success
      showConfirmButton: true,
      timer: 2000,
      ruta: "/",
      user: user.nombre,
      userid: dni,
      apellido: "",
      logo: "",
      token, // Shorthand property
      nombre: user.nombre,
    });

  } catch (error) {
    console.error("Error en el login:", error);
    next(error); // Pasa el error al middleware de manejo de errores
  }
});

//    listado decarrito de compras
router.get("/carritobarra", async (req, res) => {
  console.log(res.lis);

  res.render("carrito"); // pasar pro a carritoadd
});

export default router;
