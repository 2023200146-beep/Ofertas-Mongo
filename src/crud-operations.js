import { obtenerColeccion } from './database.js';

// 1. CREAR NUEVA OFERTA
export async function crearOferta(datosOferta) {
    try {
        const collection = await obtenerColeccion();
        
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

// 6. ESTADÍSTICAS
export async function obtenerEstadisticas() {
    try {
        const collection = await obtenerColeccion();
        const documentos = await collection.find().toArray();
        
        if (documentos.length === 0) {
            return {
                totalOfertas: 0,
                salarioPromedio: 0,
                empresasUnicas: 0,
                ofertasPorExperiencia: {}
            };
        }
        
        const empresas = [...new Set(documentos.map(d => d.Empresa?.RazonSoc).filter(Boolean))];
        const totalSalario = documentos.reduce((sum, d) => sum + (d.PagoMensual || 0), 0);
        
        const ofertasPorExperiencia = {};
        documentos.forEach(oferta => {
            const exp = oferta.Experiencia || 'Sin experiencia';
            ofertasPorExperiencia[exp] = (ofertasPorExperiencia[exp] || 0) + 1;
        });
        
        return {
            totalOfertas: documentos.length,
            salarioPromedio: Math.round(totalSalario / documentos.length),
            empresasUnicas: empresas.length,
            ofertasPorExperiencia: ofertasPorExperiencia
        };
        
    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        return {};
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