import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import pool from './db.js';
import router from "./src/routes/router.js"; // Movido arriba para orden

// 1. Configuración de variables de entorno
dotenv.config();

// 2. Reconstrucción de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4020; // Ajustado a tu puerto actual

// 3. Motor de plantillas Handlebars (Configuración ÚNICA con Helpers)
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        list: (...args) => args.slice(0, -1),
        isChecked: (filtros, key) => (filtros && filtros[key] ? 'checked' : '')
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 4. Middlewares y Archivos Estáticos (IMPORTANTE: Antes de las rutas)
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 5. Rutas
app.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM producto");
        res.render('home', { productos: rows });
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

app.get('/productos', async (req, res) => {
    try {
        const { f1, f2, f3, f4 } = req.query;
        let sql = "SELECT * FROM producto WHERE 1=1";
        const params = [];

        if (f1) { sql += " AND id_categoria = ?"; params.push('10'); }
        if (f2) { sql += " AND id_categoria = ?"; params.push('20'); }
        if (f3) { sql += " AND id_categoria = ?"; params.push('30'); }
        if (f4) { sql += " AND id_categoria = ?"; params.push('40'); }
        
        const [rows] = await pool.execute(sql, params);
        res.render('home', { productos: rows, filtros: req.query });
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

// Rutas del Router externo
app.use("/", router);

// 6. Manejo de errores 404 (SOLO para páginas, NO para archivos)
app.use((req, res) => {
    // Si la URL empieza con /img/ y llega aquí, es porque el archivo NO existe
    if (req.url.startsWith('/img/')) {
        return res.status(404).send('Imagen no encontrada');
    }
    res.status(404).render('home');
});

// 7. Arranque del servidor
app.listen(PORT, () => {
    console.log(`
    ✅ Servidor listo en http://localhost:${PORT}
    🔧 Modo: ${process.env.NODE_ENV || 'development'}
    `);
});
