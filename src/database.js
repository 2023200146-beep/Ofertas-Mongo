import { MongoClient } from "mongodb";

// CONFIGURACIÓN - CAMBIA ESTA CONTRASEÑA
const MONGO_URI = "mongodb+srv://root:admin@cluster0.fjkcpei.mongodb.net/";
const DB_NAME = "Ofertas";
const COLLECTION_NAME = "Productos";

let client = null;
let db = null;
let collection = null;

export async function conectarBD() {
    if (!client) {
        try {
            client = new MongoClient(MONGO_URI);
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
    return { client, db, collection };
}

export async function obtenerColeccion() {
    if (!collection) {
        await conectarBD();
    }
    return collection;
}

export async function cerrarConexion() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        collection = null;
        console.log("🔌 Conexión cerrada");
    }
}