import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';

// Importar las funciones CRUD individualmente
import { conectarBD } from './database.js';
import { 
    crearOferta, 
    leerTodasOfertas, 
    leerOfertaPorId, 
    actualizarOferta, 
    eliminarOferta, 
    obtenerEstadisticas, 
    buscarOfertas 
} from './crud-operations.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: 'secret-key-ofertas',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para pasar mensajes flash
app.use((req, res, next) => {
    res.locals.success_msg = req.session.success_msg;
    res.locals.error_msg = req.session.error_msg;
    delete req.session.success_msg;
    delete req.session.error_msg;
    next();
});

// RUTAS

// 1. Página principal
app.get('/', async (req, res) => {
    try {
        const estadisticas = await obtenerEstadisticas();
        const ultimasOfertas = await leerTodasOfertas();
        
        res.render('index', {
            title: 'Inicio - Sistema de Ofertas',
            estadisticas,
            ultimasOfertas: ultimasOfertas.slice(0, 5) // Mostrar solo 5
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la página principal');
    }
});

// 2. Página CRUD - Lista todas las ofertas
app.get('/crud', async (req, res) => {
    try {
        const ofertas = await leerTodasOfertas();
        res.render('crud', {
            title: 'Gestión de Ofertas',
            ofertas
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el CRUD');
    }
});

// 3. Página para crear nueva oferta (FORM)
app.get('/crud/nuevo', (req, res) => {
    res.render('editar', {
        title: 'Nueva Oferta',
        oferta: null,
        modo: 'crear'
    });
});

// 4. Crear nueva oferta (POST)
app.post('/crud/nuevo', async (req, res) => {
    try {
        const datosOferta = {
            Empresa: {
                RazonSoc: req.body.empresa_razon,
                Direccion: req.body.empresa_direccion,
                Distrito: req.body.empresa_distrito
            },
            Requisitos: {
                Formacion: req.body.formacion,
                Conocimientos: req.body.conocimientos ? req.body.conocimientos.split(',').map(c => c.trim()) : []
            },
            Experiencia: parseInt(req.body.experiencia) || 0,
            PagoMensual: parseInt(req.body.pago_mensual) || 0,
            Puesto: req.body.puesto,
            FechaFinal: req.body.fecha_final
        };

        const resultado = await crearOferta(datosOferta);
        
        if (resultado.success) {
            req.session.success_msg = `Oferta creada exitosamente con ID: ${resultado.nroId}`;
        } else {
            req.session.error_msg = `Error: ${resultado.error}`;
        }
        
        res.redirect('/crud');
    } catch (error) {
        console.error(error);
        req.session.error_msg = 'Error al crear la oferta';
        res.redirect('/crud');
    }
});

// 5. Página para editar oferta (FORM)
app.get('/crud/editar/:id', async (req, res) => {
    try {
        const oferta = await leerOfertaPorId(req.params.id);
        
        if (!oferta) {
            req.session.error_msg = 'Oferta no encontrada';
            return res.redirect('/crud');
        }
        
        res.render('editar', {
            title: 'Editar Oferta',
            oferta,
            modo: 'editar'
        });
    } catch (error) {
        console.error(error);
        req.session.error_msg = 'Error al cargar la oferta para editar';
        res.redirect('/crud');
    }
});

// 6. Actualizar oferta (PUT)
app.put('/crud/editar/:id', async (req, res) => {
    try {
        const nuevosDatos = {
            Empresa: {
                RazonSoc: req.body.empresa_razon,
                Direccion: req.body.empresa_direccion,
                Distrito: req.body.empresa_distrito
            },
            Requisitos: {
                Formacion: req.body.formacion,
                Conocimientos: req.body.conocimientos ? req.body.conocimientos.split(',').map(c => c.trim()) : []
            },
            Experiencia: parseInt(req.body.experiencia) || 0,
            PagoMensual: parseInt(req.body.pago_mensual) || 0,
            Puesto: req.body.puesto,
            FechaFinal: req.body.fecha_final
        };

        const resultado = await actualizarOferta(req.params.id, nuevosDatos);
        
        if (resultado.success) {
            req.session.success_msg = 'Oferta actualizada exitosamente';
        } else {
            req.session.error_msg = `Error: ${resultado.message || resultado.error}`;
        }
        
        res.redirect('/crud');
    } catch (error) {
        console.error(error);
        req.session.error_msg = 'Error al actualizar la oferta';
        res.redirect('/crud');
    }
});

// 7. Eliminar oferta (DELETE)
app.delete('/crud/eliminar/:id', async (req, res) => {
    try {
        const resultado = await eliminarOferta(req.params.id);
        
        if (resultado.success) {
            req.session.success_msg = 'Oferta eliminada exitosamente';
        } else {
            req.session.error_msg = `Error: ${resultado.message || resultado.error}`;
        }
        
        res.redirect('/crud');
    } catch (error) {
        console.error(error);
        req.session.error_msg = 'Error al eliminar la oferta';
        res.redirect('/crud');
    }
});

// 8. Página de listado completo
app.get('/listado', async (req, res) => {
    try {
        const { buscar } = req.query;
        let ofertas;
        
        if (buscar) {
            ofertas = await buscarOfertas(buscar);
        } else {
            ofertas = await leerTodasOfertas();
        }
        
        res.render('listado', {
            title: 'Listado de Ofertas',
            ofertas,
            terminoBusqueda: buscar || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el listado');
    }
});

// 9. API para obtener estadísticas (JSON)
app.get('/api/estadisticas', async (req, res) => {
    try {
        const estadisticas = await obtenerEstadisticas();
        res.json(estadisticas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// 10. API para obtener todas las ofertas (JSON)
app.get('/api/ofertas', async (req, res) => {
    try {
        const ofertas = await leerTodasOfertas();
        res.json(ofertas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ofertas' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 MongoDB: Conectado a Atlas`);
});

// Conectar a la base de datos al iniciar
conectarBD().then(() => {
    console.log('✅ Base de datos conectada');
}).catch(err => {
    console.error('❌ Error conectando a la base de datos:', err);
});