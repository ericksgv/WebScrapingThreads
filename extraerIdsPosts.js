const fs = require('fs');

// Crear una lista vacía para almacenar todos los IDs de los posts
let all_ids = [];

try {
    // Leer el contenido del archivo JSON que contiene el array de posts
    const datosJSON = fs.readFileSync('Posts.json', 'utf-8');

    // Parsear el contenido JSON
    const datos = JSON.parse(datosJSON);

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
                } catch (error) {
                    // Si 'post' o 'id' no existen, continuar con el siguiente elemento
                    return;
                }
            });
        });
    });

    // Escribir todos los IDs de los posts en un archivo txt
    fs.writeFileSync('idsPosts.txt', all_ids.join('\n'), { encoding: 'utf-8', flag: 'w' });
} catch (error) {
    console.error(`Error al procesar el archivo: ${error}`);
}
