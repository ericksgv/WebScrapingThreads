    const { Client } = require('@threadsjs/threads.js');
    const fs = require('fs');
    const { setTimeout } = require('timers');
    require('dotenv').config();

    // Obtener las credenciales del usuario desde el archivo .env
    const usuario = process.env.USUARIO;
    const contrasena = process.env.CONTRASENA;

    // Función para generar un valor aleatorio entre min (incluido) y max (excluido)
    function obtenerTiempoAleatorio(min, max) {
        return Math.floor(Math.random() * (max - min) + min) * 1000; // Convertir a milisegundos
    }

    (async () => {
        const cliente = new Client();

        try {
            // Iniciar sesión en el cliente usando las credenciales proporcionadas
            await cliente.login(usuario, contrasena);

            // Leer el contenido del archivo JSON
            const jsonPublicaciones = fs.readFileSync('publicaciones.json', 'utf-8');

            // Parsear el contenido JSON
            const publicaciones = JSON.parse(jsonPublicaciones).publicaciones;

            // Crear una lista para almacenar los IDs de las publicaciones
            let idsPublicaciones = [];
            
            // Iterar sobre cada elemento del array de publicaciones
            publicaciones.forEach(publicacion => {
                // Obtener el ID de la publicación y agregarlo a la lista de IDs
                const id = publicacion.id;
                idsPublicaciones.push(id);
            });
        
            // Iterar sobre cada línea del archivo, que contiene un ID de post en cada línea
            for (let id of idsPublicaciones) {
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
                        // Genera un tiempo de espera aleatorio entre 10 y 15 segundos
                        const tiempoDeEspera = obtenerTiempoAleatorio(10, 15);

                        // Luego de la solicitud, establece una pausa utilizando setTimeout para esperar antes de la siguiente solicitud
                        setTimeout(() => {
                            // Realiza la siguiente solicitud después de que haya pasado el tiempo de espera aleatorio
                            hacerSolicitudDespuesDeEsperaAleatoria();
                        }, tiempoDeEspera);
                    } while (tokenSiguientePagina);
                }
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        }
    })();
