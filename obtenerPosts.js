const { Client } = require('@threadsjs/threads.js');
const fs = require('fs');
const { setTimeout } = require('timers');
require('dotenv').config();

const usuario = process.env.USUARIO;
const contrasena = process.env.CONTRASENA;
const perfilThreads = process.env.PERFILTHREADS;
const cliente = new Client();

(async () => {
    try {
        await iniciarSesion();
        await obtenerPublicacionesYGenerarJSON(); 
        await obtenerComentariosThreads(); 
        await generarJSONComentarios(); 
        await generarJSONPublicacionesYComentarios(); 
    } catch (error) {
        console.error('Error:', error);
    }
})();

async function iniciarSesion() {
    await cliente.login(usuario, contrasena);
}

// Función para generar un valor aleatorio entre min (incluido) y max (excluido)
function obtenerTiempoAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min) + min) * 1000; // Convertir a milisegundos
}

//Función para obtener desde Threads las publicaciones de un usuario y generar JSON
async function obtenerPublicacionesYGenerarJSON() {
    await obtenerPublicacionesThreads();
    await generarJSONPublicaciones();
}

//Función para obtener desde Threads las publicaciones de un usuario
async function obtenerPublicacionesThreads() {
    let todosLosPosts = []; // Array para almacenar todos los posts
    let tokenSiguientePagina = null; // Inicialmente no hay un token para la siguiente página
    
    const obtenerSiguientePagina = async () => {
        try {
            // Obtener la página actual de resultados
            const paginaActual = await cliente.feeds.fetchThreads(perfilThreads, tokenSiguientePagina);
            
            // Agregar los posts de la página actual al array todosLosPosts 
            todosLosPosts = todosLosPosts.concat(paginaActual);

            // Escribir los posts de la página actual en un archivo JSON
            fs.writeFileSync('Posts.json', JSON.stringify(todosLosPosts, null, 2), { flag: 'w' }); // Usar la opción { flag: 'w' } para sobrescribir el archivo

            // Si hay una próxima página, actualizar el token para la siguiente solicitud
            tokenSiguientePagina = paginaActual.next_max_id;

            if (tokenSiguientePagina) {
                // Generar un tiempo de espera aleatorio entre 10 y 15 segundos para la próxima solicitud
                const tiempoDeEspera = obtenerTiempoAleatorio(10, 15);
                // Luego de la solicitud, establecer una pausa utilizando setTimeout para esperar antes de la siguiente solicitud
                setTimeout(obtenerSiguientePagina, tiempoDeEspera);
            }
        } catch (error) {
            console.error('Error al obtener las publicaciones:', error);
        }
    };
    // Iniciar el proceso obteniendo la primera página
    await obtenerSiguientePagina();
}


// Función para convertir un timestamp en microsegundos a una fecha legible
function convertirTimestampALegible(timestamp) {
    const milisegundos = timestamp / 1000; // Convertir a milisegundos
    const fecha = new Date(milisegundos);
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; // Se suma 1 porque los meses se indexan desde 0
    const año = fecha.getFullYear();
    return `${dia}-${mes}-${año}`;
}

//Función para generar el JSON con el estándar de salida para las publicaciones
async function generarJSONPublicaciones(){
    // Crear una lista vacía para almacenar todos los IDs de los posts
    let all_ids = [];

    try {
        // Leer el contenido del archivo JSON que contiene el array de posts
        const datosJSON = fs.readFileSync('Posts.json', 'utf-8');

        // Parsear el contenido JSON
        const datos = JSON.parse(datosJSON);

        const publicaciones = [];
        // Iterar sobre cada objeto en el array
        datos.forEach(item => {
            // Recorrer todos los elementos en 'threads' si existe
            (item.threads || []).forEach(thread => {
                // Recorrer todos los elementos en 'thread_items' para cada 'thread' si existe
                (thread.thread_items || []).forEach(thread_item => {
                    // Intentar acceder al ID del post
                    try {
                        const post_id = thread_item.post.id.split('_')[0]; // Obtener solo la parte antes del guion bajo
                        all_ids.push(post_id);

                        let descripcion = ""; // Inicializar la descripción como una cadena vacía
                        if (thread_item.post.caption !== null) {
                            descripcion = thread_item.post.caption.text;
                        }
                        const comentarios = [];
                        const fecha = convertirTimestampALegible(thread_item.post.device_timestamp);
                        const fuente = "Threads";

                        // Crear un objeto para la publicación actual
                        const publicacion = {
                            id: post_id,
                            descripcion: descripcion,
                            comentarios: comentarios,
                            fecha: fecha,
                            fuente: fuente
                        };

                        // Agregar la publicación al array de publicaciones
                        publicaciones.push(publicacion);

                    } catch (error) {
                        // Si 'post' o 'id' no existen, continuar con el siguiente elemento
                        return;
                    }
                });
            });
        });


        // Crear el objeto JSON final con el array de publicaciones
        const jsonPublicaciones = {
            publicaciones: publicaciones
        };

        // Convertir el objeto JSON a una cadena
        const jsonStr = JSON.stringify(jsonPublicaciones, null, 2);
    
        // Escribir el objeto JSON en un archivo
        fs.writeFileSync('publicaciones.json', jsonStr, { encoding: 'utf-8', flag: 'w' });

    } catch (error) {
        console.error(`Error al procesar el archivo: ${error}`);
    }
}

//Función para obtener desde Threads los comentarios de cada publicación
async function obtenerComentariosThreads() {
    let comentarios = [];
    const rutaArchivoLectura = 'publicaciones.json';
    const rutaArchivoEscritura = 'comentarios.json';
    try {
        const datos = fs.readFileSync(rutaArchivoLectura, 'utf-8');
        const datosJSON = JSON.parse(datos);

        if (fs.existsSync(rutaArchivoEscritura)) {
            const fileContent = fs.readFileSync(rutaArchivoEscritura, 'utf-8');
            const parsedContent = JSON.parse(fileContent);
            if (parsedContent.comentarios) {
                comentarios = parsedContent.comentarios;
            }
        }

        const cliente = new Client();
        await cliente.login(usuario, contrasena);

        const jsonPublicaciones = fs.readFileSync(rutaArchivoLectura, 'utf-8');
        const publicaciones = JSON.parse(jsonPublicaciones).publicaciones;

        let idsPublicaciones = publicaciones.map(publicacion => publicacion.id.trim()).filter(id => id !== '');

        for (let id of idsPublicaciones) {
            let todosLosPosts = [];
            let tokenSiguientePagina = null;

            do {
                const paginaActual = await cliente.posts.fetch(id, tokenSiguientePagina);
                paginaActual.id = id;
                //const postID = paginaActual.containing_thread.thread_items[0].post.id;
                const fileName = `PaginaComentariosPost_${tokenSiguientePagina}.json`;
                // Escribir los posts de la página actual en un archivo JSON
                fs.writeFileSync(fileName, JSON.stringify(paginaActual, null, 2), 'utf-8');

                if (paginaActual.paging_tokens.downwards) {
                    tokenSiguientePagina = paginaActual.paging_tokens.downwards;
                } else {
                    tokenSiguientePagina = null;
                }

                const tiempoDeEspera = obtenerTiempoAleatorio(10, 15);

                await new Promise(resolve => setTimeout(resolve, tiempoDeEspera));
            } while (tokenSiguientePagina);
        }

    } catch (error) {
        console.error('Error fetching threads:', error);
    }
}

// Función para procesar los comentarios extraídos de Threads
async function generarJSONComentarios() {
    // Crear una lista vacía para almacenar todos los textos de los comentarios
    let comentarios = [];

    const rutaArchivoEscritura = 'comentarios.json';

    // Verificar si el archivo existe
    if (fs.existsSync(rutaArchivoEscritura)) {
        // Eliminar el archivo si ya existe
        fs.unlinkSync(rutaArchivoEscritura);
    }

    // Obtener la lista de archivos JSON que contienen "PaginaComentariosPost_" en el nombre
    const archivosJSON = fs.readdirSync('./').filter(file => file.includes('PaginaComentariosPost_'));

    // Iterar sobre cada archivo JSON
    archivosJSON.forEach(file => {
        try {
            // Leer el contenido del archivo JSON
            const datos = JSON.parse(fs.readFileSync(file, 'utf-8'));

            if (datos.reply_threads.length > 0) {
                for (const thread of datos.reply_threads) {
                    for (const comentario of thread.thread_items) {
                        comentarios.push({
                            "id": datos.id,
                            "usuario": comentario.post.caption.user.username,
                            "descripcion": comentario.post.caption.text,
                            "reacciones": comentario.post.like_count,
                            "fecha": convertirTimestampALegible(comentario.post.device_timestamp)
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error al procesar el archivo ${file}: ${error}`);
        }
    });

    //Longitud de comentarios
    console.log("Longitud de comentarios: ", comentarios.length);

    // Escribir todos los comentarios en el archivo JSON
    const nuevoContenido = JSON.stringify({ comentarios }, null, 2);
    fs.writeFileSync(rutaArchivoEscritura, nuevoContenido, 'utf-8');

    // Iterar sobre cada archivo y eliminarlo
    archivosJSON.forEach(file => {
        try {
            fs.unlinkSync(file);
        } catch (error) {
            console.error(`Error al eliminar el archivo ${file}: ${error}`);
        }
    });
}

//Función para generar el archivo JSON con las publicaciones y comentarios con el formato estandar de salida
async function generarJSONPublicacionesYComentarios(){
    // Leer los archivos JSON
    const publicacionesJSON = fs.readFileSync('publicaciones.json', 'utf-8');
    const comentariosJSON = fs.readFileSync('comentarios.json', 'utf-8');

    // Convertir los JSON en objetos JavaScript
    const publicaciones = JSON.parse(publicacionesJSON).publicaciones;
    const comentarios = JSON.parse(comentariosJSON).comentarios;

    // Iterar sobre los comentarios y agruparlos por ID de publicación
    const comentariosPorPublicacion = comentarios.reduce((acc, comentario) => {
        if (!acc[comentario.id]) {
            acc[comentario.id] = [];
        }
        // Quitar la propiedad 'id' de cada comentario antes de agregarlo
        const { id, ...comentarioSinId } = comentario;
        acc[comentario.id].push(comentarioSinId);
        return acc;
    }, {});

    // Agregar los comentarios a las publicaciones correspondientes
    publicaciones.forEach(publicacion => {
        const comentariosDePublicacion = comentariosPorPublicacion[publicacion.id];
        if (comentariosDePublicacion) {
            publicacion.comentarios = comentariosDePublicacion;
        }
    });

    // Escribir el JSON modificado de vuelta al archivo
    const nuevoContenido = JSON.stringify({ publicaciones }, null, 2);
    fs.writeFileSync('data.json', nuevoContenido, 'utf-8');
}
