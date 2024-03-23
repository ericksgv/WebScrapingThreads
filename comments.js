const { Client } = require('@threadsjs/threads.js');
const fs = require('fs');
require('dotenv').config();

// Obtener las credenciales del usuario desde el archivo .env
const usuario = process.env.USUARIO;
const contrasena = process.env.CONTRASENA;

(async () => {
    const cliente = new Client();

    try {
        // Iniciar sesión en el cliente usando las credenciales proporcionadas
        await cliente.login(usuario, contrasena);

        // Leer el archivo que contiene los IDs de los posts
        const ids = fs.readFileSync('idsPosts.txt', 'utf-8').split('\n');

        // Iterar sobre cada línea del archivo, que contiene un ID de post en cada línea
        for (let id of ids) {
            // Eliminar espacios en blanco adicionales
            id = id.trim();
            if (id !== '') {
                let todosLosPosts = []; // Array para almacenar todos los posts
                let tokenSiguientePagina = null; // Inicialmente no hay un token para la siguiente página
                
                // Bucle para obtener todas las páginas de resultados
                do {
                    // Obtener la página actual de resultados para un post específico
                    const paginaActual = await cliente.posts.fetch(id, tokenSiguientePagina);

                    // Construir el nombre del archivo para la página actual de comentarios
                    const fileName = `PaginaComentariosPost_${tokenSiguientePagina}.json`;
                    // Escribir los posts de la página actual en un archivo JSON
                    fs.writeFileSync(fileName, JSON.stringify(paginaActual, null, 2), 'utf-8');

                    // Agregar los posts de la página actual al array todosLosPosts 
                    todosLosPosts = todosLosPosts.concat(paginaActual);

                    // Verificar si currentPage.paging_tokens está definida antes de acceder a 'downwards'
                    if (paginaActual.paging_tokens.downwards) {
                        tokenSiguientePagina = paginaActual.paging_tokens.downwards;
                        console.log(`Token de la próxima página: ${tokenSiguientePagina}`);
                    } else {
                        tokenSiguientePagina = null;
                    }
                } while (tokenSiguientePagina);
            }
        }
    } catch (error) {
        console.error('Error fetching threads:', error);
    }
})();
