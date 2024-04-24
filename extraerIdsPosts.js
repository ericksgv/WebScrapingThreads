const fs = require('fs');

// Función para convertir un timestamp en microsegundos a una fecha legible
function convertirTimestampALegible(timestamp) {
    const milisegundos = timestamp / 1000; // Convertir a milisegundos
    const fecha = new Date(milisegundos);
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; // Se suma 1 porque los meses se indexan desde 0
    const año = fecha.getFullYear();
    return `${dia}-${mes}-${año}`;
}

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
