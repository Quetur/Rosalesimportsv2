import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import pool from './db.js';

// 1. Configuración de variables de entorno
dotenv.config();

// 2. Reconstrucción de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Motor de plantillas Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 4. Middlewares y Archivos Estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 5. Rutas
app.get('/',async (req, res) => {
    ; // Empezamos con una condición falsa para facilitar la concatenación
    try{
        const [rows] = await pool.query("SELECT * FROM producto");
        res.render('home', { productos: rows });
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }

    /*
    res.render('home', {
        title: 'Rosalesimports',
        year: new Date().getFullYear(),
        hideSidebar: false ,
        appName: process.env.APP_NAME || 'NodeApp'
    });
    */
});

app.get('/productos', async (req, res) => {
    try {
        const { f1, f2, f3, f4 } = req.query;
        let sql = "SELECT * FROM producto where 1=1"; // Empezamos con una condición falsa para facilitar la concatenación
        const params = [];

        if (f1) { sql += " and id_categoria = ?"; params.push('10'); }
        if (f2) { sql += " and id_categoria = ?"; params.push('20'); }
        if (f3) { sql += " and id_categoria = ?"; params.push('30'); }
        if (f4) { sql += " AND envio_gratis = 1"; }
        console.log("SQL:", sql, "Params:", params);
        const [rows] = await pool.execute(sql, params);
        res.render('home', { productos: rows, filtros: req.query });
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

// Configuración de Handlebars con Helpers
app.engine('.hbs', engine({
    extname: '.hbs',
    helpers: {
        // Genera una lista para el bucle each: {{#each (list "f1" "f2")}}
        list: (...args) => args.slice(0, -1),
        // Verifica si un filtro debe estar marcado: {{isChecked filtros "f1"}}
        isChecked: (filtros, key) => (filtros && filtros[key] ? 'checked' : '')
    }
}));

import router  from "./src/routes/router.js";
app.use("/", router);


// Manejo de errores 404 (Siempre al final de las rutas)
app.use((req, res) => {
    res.status(404).render('home');
});

// 6. Arranque del servidor
app.listen(PORT, () => {
    console.log(`
    ✅ Servidor listo
    🌐 URL: http://localhost:${PORT}
    🔧 Modo: ${process.env.NODE_ENV || 'development'}
    `);
});
