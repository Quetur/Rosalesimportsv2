import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import pool from './db.js';
import session from 'express-session'; // Importado
import router from "./src/routes/router.js"; 

// 1. Configuración de variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4020;

// 2. Motor de plantillas
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        list: (...args) => args.slice(0, -1),
        // Agrega este helper:
        concat: (a, b) => String(a) + String(b), 
        isChecked: (filtros, key) => (filtros && filtros[key] ? 'checked' : '')
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 3. Middlewares de datos y estáticos
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Cambiado a true para manejar objetos complejos

// 4. CONFIGURACIÓN DE SESIÓN (MOVIDO AQUÍ - ANTES DE LAS RUTAS)
app.use(session({
  secret: process.env.MICLAVESECRETA || 'default_secret', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 3600000 
  }
}));

// 5. RUTAS
// Nota: req.session ya está disponible para estas rutas
app.get('/', async (req, res) => {
    try {
        // 1. OBTENER CATEGORÍAS (Para que el sidebar no salga vacío en el inicio)
        const [categorias] = await pool.execute("SELECT id_categoria, des FROM categoria");

        // 2. LÓGICA DE FILTRADO (Copiada de tu ruta /productos)
        let sql = "SELECT * FROM producto WHERE 1=1";
        const params = [];

        Object.keys(req.query).forEach((key) => {
            if (key.startsWith("f")) {
                const idCategoria = key.substring(1);
                sql += " AND id_categoria = ?";
                params.push(idCategoria);
            }
        });

        const [rows] = await pool.execute(sql, params);

        // 3. RENDERIZAR (Pasando productos Y categorías)
        res.render('home', { 
            productos: rows, 
            categorias: categorias, // <--- AHORA SÍ LLEGAN AL SIDEBAR
            filtros: req.query 
        });
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

// Rutas del Router externo (Ahora sí verán la sesión)
app.use("/", router);

// 6. Manejo de errores 404
app.use((req, res) => {
    if (req.url.startsWith('/img/')) {
        return res.status(404).send('Imagen no encontrada');
    }
    res.status(404).render('home');
});

// 7. Arranque
app.listen(PORT, () => {
    console.log(`✅ Servidor listo en http://localhost:${PORT}`);
});
 