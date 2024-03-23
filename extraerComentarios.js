const fs = require('fs');
const path = require('path');

// Crear una lista vacía para almacenar todos los textos de los comentarios
let comentarios = [];

// Obtener la lista de archivos JSON que contienen "PaginaComentariosPost_" en el nombre
const archivosJSON = fs.readdirSync('./').filter(file => file.includes('PaginaComentariosPost_'));

// Iterar sobre cada archivo JSON
archivosJSON.forEach(file => {
    try {
        // Leer el contenido del archivo JSON
        const datos = JSON.parse(fs.readFileSync(file, 'utf-8'));

        // Recorrer todos los elementos en 'reply_threads'
        datos.reply_threads.forEach(reply_thread => {
            // Recorrer todos los elementos en 'thread_items' para cada 'reply_thread'
            reply_thread.thread_items.forEach(thread_item => {
                // Intentar acceder al texto del comentario
                try {
                    const caption_text = thread_item.post.caption.text;
                    comentarios.push(caption_text);
                } catch (error) {
                    // Si 'post', 'caption', o 'text' no existen, o si 'caption' es None, continuar con el siguiente elemento
                    return;
                }
            });
        });
    } catch (error) {
        console.error(`Error al procesar el archivo ${file}: ${error}`);
    }
});

// Escribir todos los comentarios en un archivo txt
fs.writeFileSync('comentarios.txt', comentarios.join('\n'), { encoding: 'utf-8', flag: 'a' });
