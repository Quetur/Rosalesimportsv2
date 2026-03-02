import express from "express";
import pool from "../db.js";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { isAuthenticated } from "./authenticated.js";

const router = express.Router();

// Configuración de AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configuración de Multer con S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `productos/${Date.now()}_${file.originalname}`);
    },
  }),
});

router.get("/productos", async (req, res) => {
  console.log("GET /productos");
  try {
    // 1. Obtener todas las categorías para llenar el Sidebar
    const [categorias] = await pool.execute("SELECT id_categoria, des FROM categoria");
    console.log("DATOS ENVIADOS:", JSON.stringify(categorias, null, 2)); // Esto debe mostrar un array
    // 2. Construir la consulta de productos dinámicamente
    let sql = "SELECT * FROM producto WHERE 1=1";
    const params = [];

    // Buscamos cualquier parámetro que empiece con 'f' (ej: f10, f20...)
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith("f")) {
        const idCategoria = key.substring(1); // Quita la 'f' para obtener el ID
        sql += " AND id_categoria = ?";
        params.push(idCategoria);
      }
    });

    const [rows] = await pool.execute(sql, params);

    // 3. Renderizar pasando AMBOS arreglos

    res.render("home", {
      productos: rows,
      categorias: categorias, // Esto llena tu {{#each categorias}}
      filtros: req.query,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error: ${err.message}`);
  }
});

router.post("/productomodi/:id", isAuthenticated, async (req, res) => {
  try {
    console.log("/productomodi/", req.params.id, req.body);
    const { id } = req.params;
    const { id_categoria } = req.body;

    if (id_categoria > "1") {
      const NuevosDatos = req.body;
      const sqlText = "UPDATE producto SET ? WHERE id_producto = ?";
      const values = [NuevosDatos, id];

      const queryCompleta = pool.format(sqlText, values);
      console.log("--- SQL A EJECUTAR ---");
      console.log(queryCompleta);
      console.log("----------------------");

      await pool.query(sqlText, values);
    }

    const [data] = await pool.query(
      "SELECT *, c.des as cat_des, producto.des as prod_des FROM producto " +
        "INNER JOIN categoria c ON c.id_categoria = producto.id_categoria " +
        "ORDER BY producto.id_categoria, producto.id_subcategoria, producto.orden"
    );

    res.render("productocambia", { data });
  } catch (error) {
    console.error("Error detectado:", error.message);
    res.status(500).send("Error en el servidor: " + error.message);
  }
});

router.get("/productonuevo", isAuthenticated, async (req, res) => {
  console.log("productonuevo");
  const [cat] = await pool.query(
    "SELECT c.id_categoria, c.des FROM categoria c"
  );
  res.render("productonuevo", { cat });
});

// RUTA CORREGIDA: Agregado middleware upload.single("foto2")
router.post(
  "/producto_nuevo_graba",
  isAuthenticated,
  upload.single("foto2"),
  async (req, res) => {
    try {
      console.dir(req.body);
      console.log("producto_nuevo_graba");

      // Clonamos los datos del cuerpo para no mutar req.body directamente
      const newProducto = { ...req.body };

      // Si Multer-S3 subió un archivo, req.file.location contiene la URL de Amazon
      if (req.file) {
        newProducto.foto2 = req.file.location;
      }

      const [result] = await pool.query("INSERT INTO producto SET ? ", [
        newProducto,
      ]);
      console.dir("resultado id:", result.insertId);

      if (result.insertId < 1) {
        console.log("error al insertar");
        res.render("productocambia");
      } else {
        console.log("producto creado con éxito");
        // Redirigimos o refrescamos la lista de productos
        const [data] = await pool.query(
          "SELECT *, c.des as cat_des, producto.des as prod_des FROM producto " +
            "INNER JOIN categoria c ON c.id_categoria = producto.id_categoria " +
            "ORDER BY producto.id_categoria, producto.id_subcategoria, producto.orden"
        );
        res.render("productocambia", { data });
      }
    } catch (error) {
      console.error("Error en grabado:", error.message);
      res.status(500).send("Error al grabar producto");
    }
  }
);

// Eliminar Producto
router.get("/productodel/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("delete", id);
  await pool.query("DELETE FROM producto WHERE id_producto = ?", [id]);

  const [data] = await pool.query(
    "SELECT *, c.des as cat_des, producto.des as prod_des FROM producto INNER JOIN categoria c ON c.id_categoria = producto.id_categoria ORDER BY producto.id_categoria,producto.id_subcategoria,producto.orden"
  );
  res.render("productocambia", { data });
});

// Cambiar estado a Visible
router.get("/tildar/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("tildar");
  const pro = await pool.query(
    "update producto set visible=1 where id_producto = ?",
    [id]
  );
  const [data] = await pool.query(
    "SELECT *, c.des as cat_des, producto.des as prod_des  FROM producto INNER JOIN categoria c ON c.id_categoria = producto.id_categoria ORDER BY producto.id_categoria,producto.id_subcategoria,producto.orden"
  );
  res.render("productocambia", { data });
});

// Cambiar estado a Oculto
router.get("/destildar/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("destildar");
  const pro = await pool.query(
    "update producto set visible=0 where id_producto = ?",
    [id]
  );
  const [data] = await pool.query(
    "SELECT *, c.des as cat_des, producto.des as prod_des  FROM producto INNER JOIN categoria c ON c.id_categoria = producto.id_categoria ORDER BY producto.id_categoria,producto.id_subcategoria,producto.orden"
  );
  res.render("productocambia", { data });
});

export default router;
