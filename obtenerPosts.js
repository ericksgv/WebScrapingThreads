const { Client } = require('@threadsjs/threads.js');
const fs = require('fs');
require('dotenv').config();
const usuario = process.env.USUARIO;
const contrasena = process.env.CONTRASENA;
const perfilThreads = process.env.PERFILTHREADS;

(async () => {
    const cliente = new Client();
    await cliente.login(usuario, contrasena);

    let todosLosPosts = []; // Array para almacenar todos los posts
    let tokenSiguientePagina = null; // Inicialmente no hay un token para la siguiente página
    
    do {
        // Obtener la página actual de resultados
        const paginaActual = await cliente.feeds.fetchThreads(perfilThreads, tokenSiguientePagina);
        console.log("paginaActual:", paginaActual); // Agregar esta línea para ver la respuesta

        // Agregar los posts de la página actual al array todosLosPosts 
        todosLosPosts = todosLosPosts.concat(paginaActual);

        // Escribir los posts de la página actual en un archivo JSON
        fs.writeFileSync('Posts.json', JSON.stringify(todosLosPosts, null, 2), 'utf-8');

        // Si hay una próxima página, actualizar el token para la siguiente solicitud
        tokenSiguientePagina = paginaActual.next_max_id;
    } while (tokenSiguientePagina); // Continuar el bucle mientras haya una próxima página
})();
