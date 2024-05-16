const fs = require("fs");

let comentarios = [];
const rutaArchivoLectura = "publicaciones.json";
const rutaArchivoEscritura = "comentarios.json";



const jsonPublicaciones = fs.readFileSync(rutaArchivoLectura, "utf-8");

console.log(jsonPublicaciones)

const publicaciones = JSON.parse(jsonPublicaciones).publicaciones;

console.log(publicaciones[0].publicacion.id)


let listaDeIDs = publicaciones.map(publicacion => publicacion.publicacion.id);

let ids = listaDeIDs[0]

for (let publicacionid of ids){
    console.log("Publicacion", publicacionid)
}



console.log(listaDeIDs)
