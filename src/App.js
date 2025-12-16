import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';
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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));  
app.use(session({
    secret: 'secret-key-ofertas',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));


app.use(express.static(path.join(__dirname, '../public')));


app.use((req, res, next) => {
    res.locals.success_msg = req.session.success_msg;
    res.locals.error_msg = req.session.error_msg;
    delete req.session.success_msg;
    delete req.session.error_msg;
    next();
});


// 1. Página principal
app.get('/', async (req, res) => {
    try {
        const estadisticas = await obtenerEstadisticas();
        const ultimasOfertas = await leerTodasOfertas();
        
        res.render('index', {
            title: 'Inicio - Sistema de Ofertas',
            estadisticas,
            ultimasOfertas: ultimasOfertas.slice(0, 5)
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
            req.session.success_msg = ` Oferta creada exitosamente con ID: ${resultado.nroId}`;
        } else {
            req.session.error_msg = ` Error: ${resultado.error}`;
        }
        
        res.redirect('/crud');
    } catch (error) {
        console.error(error);
        req.session.error_msg = ' Error al crear la oferta';
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

// 6. Actualizar oferta 
app.post('/crud/editar/:id', async (req, res) => {
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
        req.session.error_msg = ' Error al actualizar la oferta';
        res.redirect('/crud');
    }
});

// 7. Eliminar oferta 
app.post('/crud/eliminar/:id', async (req, res) => {
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
        req.session.error_msg = '❌ Error al eliminar la oferta';
        res.redirect('/crud');
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

// Ruta 404


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`MongoDB: Conectado a Atlas`);
});

// Modificar la ruta /listado para soportar búsqueda avanzada
app.get('/listado', async (req, res) => {
    try {
        console.log('Accediendo a /listado'); // Para debug
        
        const { 
            formacion, 
            conocimientos, 
            exp_min, 
            exp_max 
        } = req.query;
        
        let ofertas = await leerTodasOfertas();
        const totalOfertas = ofertas.length;
        
        console.log(`Total ofertas en BD: ${totalOfertas}`);
        
        // Aplicar filtros si existen
        if (formacion) {
            console.log(`Filtrando por formación: ${formacion}`);
            const formacionBusqueda = formacion.toLowerCase().trim();
            ofertas = ofertas.filter(oferta => {
                const formacionOferta = oferta.Requisitos?.Formacion?.toLowerCase() || '';
                return formacionOferta.includes(formacionBusqueda);
            });
        }
        
        if (conocimientos) {
            console.log(`Filtrando por conocimientos: ${conocimientos}`);
            const conocimientosArray = conocimientos.split(',').map(c => c.trim().toLowerCase()).filter(c => c);
            if (conocimientosArray.length > 0) {
                ofertas = ofertas.filter(oferta => {
                    if (!oferta.Requisitos?.Conocimientos || !Array.isArray(oferta.Requisitos.Conocimientos)) {
                        return false;
                    }
                    const ofertaConocimientos = oferta.Requisitos.Conocimientos.map(c => c.toLowerCase());
                    
                    return conocimientosArray.some(conocimiento => {
                        return ofertaConocimientos.some(oc => oc.includes(conocimiento));
                    });
                });
            }
        }
        
        if (exp_min || exp_max) {
            console.log(`Filtrando por experiencia: ${exp_min || '0'} - ${exp_max || '∞'}`);
            const minExp = exp_min ? parseInt(exp_min) : 0;
            const maxExp = exp_max ? parseInt(exp_max) : 999;
            
            // Validación A < B
            if (exp_min && exp_max && minExp > maxExp) {
                req.session.error_msg = 'Error: La experiencia mínima (A) debe ser menor que la experiencia máxima (B)';
                return res.redirect('/listado');
            }
            
            ofertas = ofertas.filter(oferta => {
                const exp = oferta.Experiencia || 0;
                
                if (exp_min && exp_max) {
                    return exp >= minExp && exp <= maxExp;
                } else if (exp_min) {
                    return exp >= minExp;
                } else if (exp_max) {
                    return exp <= maxExp;
                }
                return true;
            });
        }
        
        // Verificar si hay filtros activos
        const hasFilters = !!(formacion || conocimientos || exp_min || exp_max);
        
        console.log(`Ofertas después de filtros: ${ofertas.length}`);
        
        res.render('listado', {
            title: 'Listado de Ofertas',
            ofertas,
            totalOfertas,
            busqueda: {
                formacion: formacion || '',
                conocimientos: conocimientos || '',
                exp_min: exp_min || '',
                exp_max: exp_max || ''
            },
            hasFilters
        });
        
    } catch (error) {
        console.error(' Error en /listado:', error);
        req.session.error_msg = 'Error al cargar el listado';
        res.redirect('/listado');
    }
});

// Conectar a la base de datos al iniciar
conectarBD().then(() => {
    console.log('Base de datos conectada');
}).catch(err => {
    console.error('Error conectando a la base de datos:', err);
});

app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Página no encontrada</h1>
        <p>La ruta <strong>${req.url}</strong> no existe.</p>
        <a href="/">Volver al inicio</a>
    `);
});