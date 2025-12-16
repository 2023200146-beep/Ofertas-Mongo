import { MongoClient } from "mongodb";

// Configuración (mantén estas sin variables de entorno)
const MONGO_URI = "mongodb+srv://root:admin@cluster0.fjkcpei.mongodb.net/";
const DB_NAME = "Ofertas";
const COLLECTION_NAME = "Productos";

// Variables globales para la conexión
let client = null;
let db = null;
let collection = null;

// Función para conectar y retornar la colección
export async function conectarBD() {
    try {
        // Si ya está conectado, retornar
        if (client && client.topology && client.topology.isConnected()) {
            return { client, db, collection };
        }
        
        // Conectar nuevo cliente
        client = new MongoClient(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
        
        db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
        
        return { client, db, collection };
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
        throw error;
    }
}

// Obtener la colección (con reconexión automática)
export async function obtenerColeccion() {
    try {
        if (!collection) {
            await conectarBD();
        }
        
        // Verificar si la conexión está viva
        try {
            await db.command({ ping: 1 });
        } catch (error) {
            console.log("Reconectando a MongoDB...");
            await conectarBD();
        }
        
        return collection;
    } catch (error) {
        console.error("Error obteniendo colección:", error);
        throw error;
    }
}

// Cerrar conexión (opcional)
export async function cerrarConexion() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        collection = null;
        console.log("🔌 Conexión cerrada");
    }
}