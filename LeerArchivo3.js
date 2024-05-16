const fs = require("fs");

function convertirTimestampALegible(timestamp) {
  const fecha = new Date(timestamp * 1000);

  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

function generarJSONComentarios() {
  // Crear una lista vacía para almacenar todos los textos de los comentarios
  let comentarios = [];

  const comentariosPorId = {};

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
            console.log(comentario)
            if (comentario.post.text_post_app_info.post_preview_caption !== "Photo" && comentario.post.caption !== null) {

              reply = {
                usuario: comentario.post.user.username,
                descripcion: comentario.post.caption.text,
                reacciones: comentario.post.like_count,
                fecha: convertirTimestampALegible(comentario.post.taken_at)
              }

              if(datos.id in comentariosPorId){
                comentariosPorId[datos.id].push(
                    {
                      comentario: reply
                    }
                );
              }else{
                comentariosPorId[datos.id] = [
                    {
                      comentario: reply
                    }
                ]
              };
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

generarJSONComentarios();
