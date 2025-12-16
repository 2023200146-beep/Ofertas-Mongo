import { obtenerColeccion } from './database.js';

// 1. CREAR NUEVA OFERTA
export async function crearOferta(datosOferta) {
    try {
        const collection = await obtenerColeccion();
        
        // Obtener el último NroId
        const ultimaOferta = await collection.find().sort({ NroId: -1 }).limit(1).toArray();
        const nuevoNroId = ultimaOferta.length > 0 ? ultimaOferta[0].NroId + 1 : 1;
        
        const ofertaCompleta = {
            ...datosOferta,
            NroId: nuevoNroId,
            FechaCreacion: new Date()
        };
        
        const result = await collection.insertOne(ofertaCompleta);
        return { 
            success: true, 
            insertedId: result.insertedId, 
            nroId: nuevoNroId 
        };
        
    } catch (error) {
        console.error("Error creando oferta:", error);
        return { success: false, error: error.message };
    }
}

// 2. LEER TODAS LAS OFERTAS
export async function leerTodasOfertas() {
    try {
        const collection = await obtenerColeccion();
        return await collection.find().sort({ NroId: 1 }).toArray();
    } catch (error) {
        console.error("Error leyendo ofertas:", error);
        return [];
    }
}

// 3. LEER UNA OFERTA POR ID
export async function leerOfertaPorId(nroId) {
    try {
        const collection = await obtenerColeccion();
        const oferta = await collection.findOne({ NroId: Number(nroId) });
        return oferta;
    } catch (error) {
        console.error(`Error leyendo oferta ${nroId}:`, error);
        return null;
    }
}

// 4. ACTUALIZAR OFERTA
export async function actualizarOferta(nroId, nuevosDatos) {
    try {
        const collection = await obtenerColeccion();
        
        const result = await collection.updateOne(
            { NroId: Number(nroId) },
            { 
                $set: { 
                    ...nuevosDatos,
                    FechaActualizacion: new Date()
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return { success: false, message: "Oferta no encontrada" };
        }
        
        return { 
            success: true, 
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        };
        
    } catch (error) {
        console.error(`Error actualizando oferta ${nroId}:`, error);
        return { success: false, error: error.message };
    }
}

// 5. ELIMINAR OFERTA
export async function eliminarOferta(nroId) {
    try {
        const collection = await obtenerColeccion();
        
        const result = await collection.deleteOne({ NroId: Number(nroId) });
        
        if (result.deletedCount === 0) {
            return { success: false, message: "Oferta no encontrada" };
        }
        
        return { success: true, deletedCount: result.deletedCount };
        
    } catch (error) {
        console.error(`Error eliminando oferta ${nroId}:`, error);
        return { success: false, error: error.message };
    }
}


export async function obtenerEstadisticas() {
    try {
        const collection = await obtenerColeccion();
        
        // Verificar si collection existe
        if (!collection) {
            console.error("No se pudo obtener la colección");
            return {
                totalOfertas: 0,
                salarioPromedio: 0,
                empresasUnicas: 0
            };
        }
        
        // Obtener documentos
        const documentos = await collection.find().toArray();
        
        if (!documentos || documentos.length === 0) {
            return {
                totalOfertas: 0,
                salarioPromedio: 0,
                empresasUnicas: 0
            };
        }
        
        // Calcular estadísticas
        const empresas = [...new Set(documentos.map(d => 
            d.Empresa && d.Empresa.RazonSoc ? d.Empresa.RazonSoc : "Sin empresa"
        ))];
        
        const salariosValidos = documentos
            .filter(d => d.PagoMensual && typeof d.PagoMensual === 'number')
            .map(d => d.PagoMensual);
        
        const totalSalario = salariosValidos.reduce((sum, salario) => sum + salario, 0);
        const salarioPromedio = salariosValidos.length > 0 
            ? Math.round(totalSalario / salariosValidos.length) 
            : 0;
        
        return {
            totalOfertas: documentos.length,
            salarioPromedio: salarioPromedio,
            empresasUnicas: empresas.length
        };
        
    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        return {
            totalOfertas: 0,
            salarioPromedio: 0,
            empresasUnicas: 0
        };
    }
}
// busqueda
export async function buscarOfertasAvanzada(filtros) {
    try {
        const collection = await obtenerColeccion();
        const query = {};
        
        // Filtrar por formación
        if (filtros.formacion) {
            query['Requisitos.Formacion'] = { 
                $regex: filtros.formacion, 
                $options: 'i' 
            };
        }
        
        // Filtrar por conocimientos (búsqueda múltiple)
        if (filtros.conocimientos && Array.isArray(filtros.conocimientos)) {
            query['Requisitos.Conocimientos'] = {
                $in: filtros.conocimientos.map(c => new RegExp(c, 'i'))
            };
        }
        
        // Filtrar por experiencia
        if (filtros.exp_min !== undefined || filtros.exp_max !== undefined) {
            query.Experiencia = {};
            
            if (filtros.exp_min !== undefined) {
                query.Experiencia.$gte = parseInt(filtros.exp_min);
            }
            if (filtros.exp_max !== undefined) {
                query.Experiencia.$lte = parseInt(filtros.exp_max);
            }
        }
        
        // Filtrar por salario
        if (filtros.salario_min !== undefined || filtros.salario_max !== undefined) {
            query.PagoMensual = {};
            
            if (filtros.salario_min !== undefined) {
                query.PagoMensual.$gte = parseInt(filtros.salario_min);
            }
            if (filtros.salario_max !== undefined) {
                query.PagoMensual.$lte = parseInt(filtros.salario_max);
            }
        }
        
        return await collection.find(query).sort({ NroId: 1 }).toArray();
        
    } catch (error) {
        console.error("Error en búsqueda avanzada:", error);
        return [];
    }
}


// 7. BUSCAR OFERTAS
export async function buscarOfertas(termino) {
    try {
        const collection = await obtenerColeccion();
        
        const resultado = await collection.find({
            $or: [
                { Puesto: { $regex: termino, $options: 'i' } },
                { "Empresa.RazonSoc": { $regex: termino, $options: 'i' } }
            ]
        }).toArray();
        
        return resultado;
        
    } catch (error) {
        console.error("Error buscando ofertas:", error);
        return [];
    }
}