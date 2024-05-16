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
    await obtenerComentariosDespuesDePublicaciones();
    await generarJSONComentarios();
    await generarJSONPublicacionesYComentarios();
  } catch (error) {
    console.error("Error:", error);
  }
})();

// Función para que se incie sesión.
async function iniciarSesion() {
  await cliente.login(usuario, contrasena);
}

async function obtenerComentariosDespuesDePublicaciones() {
  try {
    await generarJSONPublicaciones();
    await obtenerComentariosThreads();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Función para hacer esperar la recolección de información un tiempo aleatorio
function obtenerTiempoAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min) + min) * 1000; // Convertir a milisegundos
}

function convertirTimestampALegible(timestamp) {
  const fecha = new Date(timestamp * 1000);

  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

//Función para obtener desde Threads las publicaciones de un usuario
async function obtenerPublicacionesThreads() {
  return new Promise((resolve, reject) => {
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
        } else {
          resolve(); // Resuelve la promesa cuando se completan todas las solicitudes
        }
      } catch (error) {
        reject(error); // Rechaza la promesa si hay un error
      }
    };
    obtenerSiguientePagina(); // Comenzar el proceso de obtención de publicaciones
  });
}

//Función para generar el JSON con el estándar de salida para las publicaciones
function generarJSONPublicaciones() {
  return new Promise((resolve, reject) => {
    try {
      console.log("Se estan obteniendo las publicaciones");
      obtenerPublicacionesThreads()
        .then(() => {
          console.log("Se obtuvieron las publicaciones");
          console.log("Se van a organizar los datos de la publicación");

          let listaDatos = [];

          fs.readFile("Posts.json", "utf8", (err, data) => {
            if (err) {
              console.error("Error al leer el archivo:", err);
              reject(err); // Rechazar la promesa en caso de error
              return;
            }
            try {
              const listaThreads = JSON.parse(data);
              let contador = 0; // Inicializamos el contador

              listaThreads.forEach(function (thread, index) {
                const threadItems = thread.threads;

                threadItems.forEach(function (item, itemIndex) {
                  // Verificar si se han agregado menos de 10 elementos a listaDatos
                  if (contador < 9) {
                    const id =
                      "" +
                      item.thread_items[0].post.id.toString().split("_")[0];
                    const timestamp = item.thread_items[0].post.taken_at;
                    const urlRegex = /(https?:\/\/[^\s]+)/;
                    let description = ""; // Inicializamos la descripción
                    if (
                      item.thread_items[0].post.caption !== null &&
                      item.thread_items[0].post.caption.text !== null &&
                      !urlRegex.test(item.thread_items[0].post.text_post_app_info.post_preview_caption)
                    ) {
                      description = item.thread_items[0].post.caption.text
                        .toString()
                        .trim()
                        .replace(/\s+/g, " ");

                      const usuario = item.thread_items[0].post.user.full_name;
                      console.log(timestamp);

                      const fecha = new Date(timestamp * 1000);

                      const dia = fecha.getDate();
                      const mes = fecha.getMonth() + 1;
                      const anio = fecha.getFullYear();

                      const fechaFormateada = `${dia}/${mes}/${anio}`;

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

                      contador++; // Incrementamos el contador
                    } 
                  }
                });
              });

              const jsonPublicaciones = {
                publicaciones: listaDatos,
              };

              const datosJSON = JSON.stringify(jsonPublicaciones, null, 2);
              fs.writeFileSync("publicaciones.json", datosJSON, {
                encoding: "utf8",
              });
              resolve(); // Resolver la promesa cuando se complete correctamente
            } catch (err) {
              console.error("Error al parsear el archivo JSON:", err);
              reject(err); // Rechazar la promesa en caso de error
            }
          });
        })
        .catch((err) => {
          console.error("Error al obtener las publicaciones:", err);
          reject(err); // Rechazar la promesa en caso de error
        });
    } catch (err) {
      console.error("Error al obtener las publicaciones:", err);
      reject(err); // Rechazar la promesa en caso de error
    }
  });
}

//Función para obtener desde Threads los comentarios de cada publicación
async function obtenerComentariosThreads() {
  console.log("Se van a recolectar los comentarios de cada publicación.");
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

    await cliente.login(usuario, contrasena);

    const jsonPublicaciones = fs.readFileSync(rutaArchivoLectura, "utf-8");
    const publicaciones = JSON.parse(jsonPublicaciones).publicaciones;

    let listaDeIDs = publicaciones.map(
      (publicacion) => publicacion.publicacion.id
    );

    for (let id of listaDeIDs) {
      let tokenSiguientePagina = null;

      do {
        const paginaActual = await cliente.posts.fetch(
          id,
          tokenSiguientePagina
        );
        paginaActual.id = id;
        const fileName = `PaginaComentariosPost_${tokenSiguientePagina}.json`;
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

  const comentariosPorId = {};

  const rutaArchivoEscritura = "comentarios.json";

  console.log(
    "Se van a organizar los comentarios obtenidos para cada una de las publicaciones"
  );

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
            console.log(comentario);
            if (
              comentario.post.text_post_app_info.post_preview_caption !==
                "Photo" &&
              comentario.post.caption !== null
            ) {
              reply = {
                usuario: comentario.post.user.username,
                descripcion: comentario.post.caption.text,
                reacciones: comentario.post.like_count,
                fecha: convertirTimestampALegible(comentario.post.taken_at),
              };

              if (datos.id in comentariosPorId) {
                comentariosPorId[datos.id].push({
                  comentario: reply,
                });
              } else {
                comentariosPorId[datos.id] = [
                  {
                    comentario: reply,
                  },
                ];
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error al procesar el archivo ${file}: ${error}`);
    }
  });

  //Longitud de comentarios
  console.log("Longitud de comentarios: ", comentarios.size);

  // Escribir todos los comentarios en el archivo JSON
  const nuevoContenido = JSON.stringify(comentariosPorId, null, 2);
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
  const comentarios = JSON.parse(comentariosJSON);

  console.log(publicaciones)
  console.log("Comentarios")
  console.log(comentarios[Object.keys(comentarios)[0]])

  publicaciones.forEach(publicacion => {
      const idPublicacion = publicacion.publicacion.id;

      console.log(idPublicacion)
  
      // Verificar si hay comentarios asociados a esta publicación
      if (idPublicacion in comentarios) {
          // Obtener los comentarios asociados a esta publicación
          const comentariosDeLaPublicacion = comentarios[idPublicacion];
          
          // Agregar los comentarios al campo comentarios de la publicación
          publicacion.publicacion.comentarios = comentariosDeLaPublicacion;
      }
  });


  // Escribir el JSON modificado de vuelta al archivo
  const nuevoContenido = JSON.stringify({ publicaciones }, null, 2);
  fs.writeFileSync("data.json", nuevoContenido, "utf-8");
}