const fs = require("fs");

function generarJSONPublicacionesYComentarios() {
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
generarJSONPublicacionesYComentarios();