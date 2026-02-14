import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import pool from "../../db.js";
import { promisify } from "util";
//import AWS from "aws-sdk";
//import fs from "fs";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Para pruebas, usa ethereal.email
  port: 587,
  secure: false, // true para puerto 465, false para otros puertos como 587
  auth: {
    user: process.env.MAIL_USER, // Tu usuario de mail
    pass: process.env.MAIL_PASS, // Tu password de mail
  },
      tls: {
        // Esta es la clave para ignorar el error del certificado
        rejectUnauthorized: false
    }
});
console.log("transporter", transporter);




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

  res.render("carrito", {hideSidebar: true }); // pasar pro a carritoadd
   
});

router.post("/send-email", async (req, res) => {
  console.log("send email");
  const {
    cliente,
    correo,
    cel,
    direccion,
    localidad,
    message,
    cant,
    desc,
    prec,
    prod_id,
    tipo,
    unid,
    sttl,
    enviostr,
    total,
    totalgralstr,
    nota,
    articulos,
    fecha,
    horalocal,
  } = req.body;
  console.log("clinte : ", cliente);
  var mfecha = fecha;
  console.log("/send-email");
  console.log("localidad :", localidad);
  var cliente_des = cliente;
  var cliente_tel = cel;
  var cliente_dir = direccion;
  var cliente_saldoAnt = 0;
  var cliente_cod = await Actuali_Cliente(
    cel,
    cliente,
    direccion,
    localidad,
    correo
  );
  console.log("codigo de cliente:", cliente_cod);

  console.log("total: ", total);
  const total2 = Math.trunc(total);
  console.log("total2: ", total2);
  const enviostr2 = Math.trunc(enviostr);
  const totalgralstr2 = Math.trunc(totalgralstr);
  console.log(prod_id);
  console.log(cant);
  console.log(desc);
  console.log(prec);
  console.log("sttl: ", sttl);
  console.log("enviostr: ", enviostr2);

  console.log("totagralstr: ", totalgralstr2);

  const hoy = fecha + "  " + horalocal;

  console.log(hoy);
  // cargo el pedido en base de datos

  var producto = [];

  var encabezado = ``,
    cuerpo = ``,
    pie = ``;
  encabezado = `
  <ul>
  <a>Hola ${cliente}, </a>
  <a>hemos recibido tu pedido, generado a traves de nuestra pagina web</a><br>
  <a>Nos estaremos comunicando con vos al numero : ${cel}  dentro de las 48 hs habliles </a><br>
  <a>Tu pedido del dia ${hoy}, ha sido enviado con el siguiente detalle.</a><br><br>
  <a>Muchas Gracias</a><br>
  </ul>

  <br>
  <style type="text/css">
    table {width: 100%; border-collapse: collapse;}
    td, th {border: solid 1px black;}
    h1 {text-align: center;}
    span {float: right;}
  </style>
  <hr/>
  <hr/>
  <b> Cliente : </b>${cliente} <b><br>
  <b> Email : </b>${correo}</b><br>
  <b> Telefono : </b>${cel}<br>
  <b> Direccion : </b>${direccion} , </b>${localidad} <br>
  <hr/>
  <p></p>
  <table>
    <thead>
      <tr>
        <th>Cantidad</th>
        <th style="text-align:left">Descripcion</th>
        <th>Precio Unitario</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>`;
  //console.log("length cant: ", cant.length);
  if (articulos > 1) {
    for (let i = 0; i < cant.length; i++) {
      console.log(desc[i]);
      producto.push([cant[i], desc[i], prec[i], sttl[i], prod_id[i]]);
    }
    for (let i = 0; i < producto.length; i++) {
      cuerpo =
        cuerpo +
        `<tr>
            <td class="text-right" style="text-align:right" ;>
              <a type="text"  name="cant" hidden=true>${producto[i][0]}&#09;</a></td>
            <td>
              <a type="text" name="desc" hidden=true>${producto[i][1]}&#09;</a></td>
            <td class="text-right" style="text-align:right">
              <a type="text" name="precio" hidden=true>${producto[i][2]}&#09;</a></td>
            <td class="text-right" id='subtotales' style="text-align:right">
              <a type="text" name="sttl" style="text-align:right" text hidden=true>${producto[i][3]}&#09;</a></td>
        </tr>`;
    }
  } else {
    cuerpo =
      cuerpo +
      `<tr>
        <td class="text-right" style="text-align:right" ;>
          <a type="text"  name="cant" hidden=true>${cant} </a></td>
        <td>
          <a type="text" name="desc" hidden=true>${desc}</a></td>
        <td class="text-right" style="text-align:right">
          <a type="text"  name="precio" hidden=true>${prec}</a></td>
        <td class="text-right" id='subtotales' style="text-align:right">
          <a type="text" name="sttl" style="text-align:right" text hidden=true>${sttl}</a></td>
        </tr>`;
  }

  pie = `

  <tr> 
    <td></td>
    <td></td> 
    <td>Sub Total</td>
    <td style="text-align:right" >${total2}</td>
  </tr>  
  <tr> 
    <td></td>
    <td></td>  
    <td>Envio</td>
    <td style="text-align:right" >${enviostr2}</td> 
  </tr>  
  <tr>  
    <td></td>
    <td></td>   
    <td>Total Pedido</td>
    <td style="text-align:right" >${totalgralstr2}
  </td> 
  
  </tr>   
    
  </tbody>
  </table> 
  <b>Nota: </b> ${nota}<br>
  <hr/> <hr/>
  <p><b> Importante:</b>  Todos los productos estan sujetos a disponobilidad.</p>
  <p><b>Si desea que le enviemos el pediodo su costo sera infortado  </b>.</p>
  <p>Muchas Gracias</p>`;

  const contentHTML = encabezado + cuerpo + pie;

  const mailOptions = {
    from: "rosalesjimport@gmail.com",
    cc: "rosalesjimports@gmail.com,rosalesjulian2302@gmail.com",
    to: correo,
    subject: "Pedido de Los Rosales Imports",
    text: cel,
    html: contentHTML,
  };

  //console.log(mailOptions);
  ///genero pedido

  /*const pedido_nro = await Genera_Pedido(fecha, horalocal, cliente_cod,
    cliente_des, cliente_tel, cliente_dir, total, nota, cliente_saldoAnt,
    producto, prod_id, desc, cant, prec, sttl)
*/

  // envio el mail

  console.log("antes del send mail", mailOptions);
  var result = await transporter.sendMail(mailOptions); // le doy laorden para que lo mande
  console.log("despues del send mail", result);
  //  console.log(ppp)
  if (!result) {
    console.log("error :", result);
    res.render("carrito2");
  } else {
    console.log("Email enviado");
    res.render("mailok");
  }
});


async function Actuali_Cliente(
  telefono,
  cliente,
  direccion,
  localidad,
  correo
) {
  console.log("Actuali_Cliente busco :", telefono);
  try {
    console.log("busco el telefono :", telefono);
    var [cli_busqueda] = await busca_cliente(telefono);

    console.log("cliente encontrado: ", cli_busqueda);
    if (cli_busqueda == 0) {
      var cli_busqueda = await nuevo_cliente(
        telefono,
        cliente,
        direccion,
        localidad,
        correo
      );
      console.log("nuevo cliente: ", cli_busqueda);
    }
    if (cli_busqueda > 0) {
      console.log("saldo anterir: ", cliente_saldoAnt);
    }
    return cli_busqueda;
  } catch (e) {
    console.log("error jesus :", e);
  }
}

async function busca_cliente(telefono) {
  let rows=""
  let cliente_cod=""
  let cliente_saldoAnt=""
  let clienteNuevo=""
  const linealsql = "SELECT * FROM cliente WHERE telefono = '" + telefono + "'";
  console.log("linea de sql : ", linealsql);
  var result = await pool.query(linealsql);
  console.log("encontro  : ", result.length);
  console.log("cliente", result[0])
  if (result.length > 0) {
    rows = JSON.parse(JSON.stringify(result[0]));
    cliente_cod = result[0].id
    cliente_saldoAnt =  result[0].saldo
    clienteNuevo = false;
    console.log("codigo del encontrado: ", cliente_cod);
    console.log("saldo en funcion:", cliente_saldoAnt);
  }
  if (result == 0) {
    console.log("cliente nuevo");
    clienteNuevo = true;
    cliente_cod = 0;
  }
  return cliente_cod;
}

async function nuevo_cliente(cel, cliente_des, direccion, localidad, correo) {
  console.log("entro en nuevo");
  var lineadesql =
    "INSERT INTO cliente values (NULL,'" +
    cliente_des +
    "', '" +
    direccion +
    "', '" +
    localidad +
    "', '" +
    cel +
    "', '" +
    " " +
    "', '" +
    " " +
    "', '" +
    correo +
    "', '" +
    1 +
    "', '" +
    0 +
    "', '" +
    0 +
    "' , 'efectivo'" +
    ")";
  console.log("linea de cliente nuevo", lineadesql);
  var result = await pool.query(lineadesql);
  console.log("despues que creo :", result.insertId);
  return result.insertId;
}

export default router;
