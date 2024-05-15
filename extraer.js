const { Client } = require("@threadsjs/threads.js");
const fs = require("fs");
const { setTimeout } = require("timers");
require("dotenv").config();

const usuario = process.env.USUARIO;
const contrasena = process.env.CONTRASENA;
const perfilThreads = process.env.PERFILTHREADS;
const cliente = new Client();

(async () => {
  try {
      await iniciarSesion();
      await obtenerPublicacionesYGenerarJSON(); 
  } catch (error) {
      console.error('Error:', error);
  }
})();

async function iniciarSesion() {
  await cliente.login(usuario, contrasena);
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
      const paginaActual = await cliente.feeds.fetchThreads(
        perfilThreads,
        tokenSiguientePagina
      );

      // Agregar los posts de la página actual al array todosLosPosts
      todosLosPosts = todosLosPosts.concat(paginaActual);

      // Escribir los posts de la página actual en un archivo JSON
      fs.writeFileSync("Posts.json", JSON.stringify(todosLosPosts, null, 2), {
        flag: "w",
      }); // Usar la opción { flag: 'w' } para sobrescribir el archivo

      // Si hay una próxima página, actualizar el token para la siguiente solicitud
      tokenSiguientePagina = paginaActual.next_max_id;

      if (tokenSiguientePagina) {
        // Generar un tiempo de espera aleatorio entre 10 y 15 segundos para la próxima solicitud
        const tiempoDeEspera = obtenerTiempoAleatorio(10, 15);
        // Luego de la solicitud, establecer una pausa utilizando setTimeout para esperar antes de la siguiente solicitud
        setTimeout(obtenerSiguientePagina, tiempoDeEspera);
      }
    } catch (error) {
      console.error("Error al obtener las publicaciones:", error);
    }
  };
  // Iniciar el proceso obteniendo la primera página
  await obtenerSiguientePagina();
}

//Función para generar el JSON con el estándar de salida para las publicaciones
async function generarJSONPublicaciones() {
  let listaDatos = [];

  fs.readFile("Posts.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo:", err);
      return;
    }
    try {
      // Parsea el contenido del archivo JSON a un objeto JavaScript
      const listaThreads = JSON.parse(data);
      listaThreads.forEach(function (thread, index) {
        const threadNumber = index + 1;

        const threadItems = thread.threads;

        threadItems.forEach(function (item, itemIndex) {
          const id = "" + item.thread_items[0].post.id.toString().split("_")[0];
          const timestamp = item.thread_items[0].post.taken_at;
          if (
            item.thread_items[0].post.caption !== null &&
            item.thread_items[0].post.caption.text !== null
          ) {
            description = item.thread_items[0].post.caption.text
              .toString()
              .trim()
              .replace(/\s+/g, " ");
          } else {
            description = "Sin descripcion";
          }
          const usuario = item.thread_items[0].post.user.full_name;
          console.log(timestamp);

          const fecha = new Date(timestamp * 1000);

          const dia = fecha.getDate();
          const mes = fecha.getMonth() + 1;
          const anio = fecha.getFullYear();

          const datos = {
            id: id,
            fecha: fechaFormateada,
            descripcion: description,
            usuario: usuario,
          };

          const publicacionJson = {
            publicacion: datos,
          };

          listaDatos.push(publicacionJson);
        });
      });

      const jsonPublicaciones = {
        publicaciones: listaDatos,
      };

      const datosJSON = JSON.stringify(jsonPublicaciones, null, 2);
      fs.writeFileSync("publicaciones.json", datosJSON, { encoding: "utf8" });
    } catch (err) {
      console.error("Error al parsear el archivo JSON:", err);
    }
  });
}

// Función para generar un valor aleatorio entre min (incluido) y max (excluido)
function obtenerTiempoAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min) + min) * 1000; // Convertir a milisegundos
}

//Función para obtener desde Threads los comentarios de cada publicación
async function obtenerComentariosThreads() {
  let comentarios = [];
  const rutaArchivoLectura = "publicaciones.json";
  const rutaArchivoEscritura = "comentarios.json";
  try {
    const datos = fs.readFileSync(rutaArchivoLectura, "utf-8");
    const datosJSON = JSON.parse(datos);

    if (fs.existsSync(rutaArchivoEscritura)) {
      const fileContent = fs.readFileSync(rutaArchivoEscritura, "utf-8");
      const parsedContent = JSON.parse(fileContent);
      if (parsedContent.comentarios) {
        comentarios = parsedContent.comentarios;
      }
    }

    const cliente = new Client();
    await cliente.login(usuario, contrasena);

    const jsonPublicaciones = fs.readFileSync(rutaArchivoLectura, "utf-8");
    const publicaciones = JSON.parse(jsonPublicaciones).publicaciones;

    let idsPublicaciones = publicaciones
      .map((publicacion) => publicacion.id.trim())
      .filter((id) => id !== "");

    for (let id of idsPublicaciones) {
      let todosLosPosts = [];
      let tokenSiguientePagina = null;

      do {
        const paginaActual = await cliente.posts.fetch(
          id,
          tokenSiguientePagina
        );
        paginaActual.id = id;
        //const postID = paginaActual.containing_thread.thread_items[0].post.id;
        const fileName = `PaginaComentariosPost_${tokenSiguientePagina}.json`;
        // Escribir los posts de la página actual en un archivo JSON
        fs.writeFileSync(
          fileName,
          JSON.stringify(paginaActual, null, 2),
          "utf-8"
        );

        if (paginaActual.paging_tokens.downwards) {
          tokenSiguientePagina = paginaActual.paging_tokens.downwards;
        } else {
          tokenSiguientePagina = null;
        }

        const tiempoDeEspera = obtenerTiempoAleatorio(10, 15);

        await new Promise((resolve) => setTimeout(resolve, tiempoDeEspera));
      } while (tokenSiguientePagina);
    }
  } catch (error) {
    console.error("Error fetching threads:", error);
  }
}

// Función para procesar los comentarios extraídos de Threads
async function generarJSONComentarios() {
  // Crear una lista vacía para almacenar todos los textos de los comentarios
  let comentarios = [];

  const rutaArchivoEscritura = "comentarios.json";

  // Verificar si el archivo existe
  if (fs.existsSync(rutaArchivoEscritura)) {
    // Eliminar el archivo si ya existe
    fs.unlinkSync(rutaArchivoEscritura);
  }

  // Obtener la lista de archivos JSON que contienen "PaginaComentariosPost_" en el nombre
  const archivosJSON = fs
    .readdirSync("./")
    .filter((file) => file.includes("PaginaComentariosPost_"));

  // Iterar sobre cada archivo JSON
  archivosJSON.forEach((file) => {
    try {
      // Leer el contenido del archivo JSON
      const datos = JSON.parse(fs.readFileSync(file, "utf-8"));

      if (datos.reply_threads.length > 0) {
        for (const thread of datos.reply_threads) {
          for (const comentario of thread.thread_items) {
            comentarios.push({
              id: datos.id,
              usuario: comentario.post.caption.user.username,
              descripcion: comentario.post.caption.text,
              reacciones: comentario.post.like_count,
              fecha: convertirTimestampALegible(
                comentario.post.device_timestamp
              ),
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
  fs.writeFileSync(rutaArchivoEscritura, nuevoContenido, "utf-8");

  // Iterar sobre cada archivo y eliminarlo
  archivosJSON.forEach((file) => {
    try {
      fs.unlinkSync(file);
    } catch (error) {
      console.error(`Error al eliminar el archivo ${file}: ${error}`);
    }
  });
}

//Función para generar el archivo JSON con las publicaciones y comentarios con el formato estandar de salida
async function generarJSONPublicacionesYComentarios() {
  // Leer los archivos JSON
  const publicacionesJSON = fs.readFileSync("publicaciones.json", "utf-8");
  const comentariosJSON = fs.readFileSync("comentarios.json", "utf-8");

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
  publicaciones.forEach((publicacion) => {
    const comentariosDePublicacion = comentariosPorPublicacion[publicacion.id];
    if (comentariosDePublicacion) {
      publicacion.comentarios = comentariosDePublicacion;
    }
  });

  // Escribir el JSON modificado de vuelta al archivo
  const nuevoContenido = JSON.stringify({ publicaciones }, null, 2);
  fs.writeFileSync("data.json", nuevoContenido, "utf-8");
}
