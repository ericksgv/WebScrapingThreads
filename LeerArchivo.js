const fs = require("fs");

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
            .replace(/\s+/g, " ")
        } else {
          description = "Sin descripcion";
        }
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
      });
    });

    const jsonPublicaciones = {
      publicaciones: listaDatos,
    };

    const datosJSON = JSON.stringify(jsonPublicaciones, null, 2);
    fs.writeFileSync("publicaciones.json", datosJSON, { encoding: 'utf8' });
  } catch (err) {
    console.error("Error al parsear el archivo JSON:", err);
  }
});
