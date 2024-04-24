# WebScrapingThreads

Este proyecto es realizado únicamente con fines educativos y de aprendizaje. Se utiliza la librería [threads.js](https://github.com/threadsjs/threads.js) para poder realizar web scraping sobre los comentarios de las publicaciones de un usuario de la red social Threads.

> [!NOTE]
> La [librería](https://github.com/threadsjs/threads.js) utiliza paginación para obtener las publicaciones y los comentarios. Por lo tanto, en el código se obtiene la paginación actual para continuar extrayendo a partir de ese punto y así obtener todas las publicaciones y comentarios. Es importante tener en cuenta que el número de publicaciones y comentarios a veces no coincide con los mostrados en la red social, ya que no se consideran publicaciones de solo imágenes ni videos.

> [!CAUTION]
> Es importante tener en cuenta que el scraping de la red social Threads está prohibido por sus términos de servicio. Por lo tanto, el uso de este proyecto para recolectar datos de Threads puede infringir dichos términos y condiciones. Se advierte que el uso de este proyecto para tales fines puede resultar en consecuencias como la suspensión o el cierre de la cuenta de usuario en Threads. Por lo anterior, se recomienda no utilizar una cuenta personal, ya que existe el riesgo de que dicha cuenta sea bloqueada. Para evitar este problema, se sugiere crear una cuenta secundaria exclusivamente para este proyecto.

> [!WARNING]
> Es importante no realizar peticiones de forma continua, se recomienda dejar un lapso de al menos 30 minutos entre cada solicitud para evitar ser baneado por la red social Threads. Además, es importante no compartir la cuenta para evitar solicitudes desde diferentes direcciones IP, lo cual podría resultar en un bloqueo de la cuenta.

## Instalación Y configuración ⚙️🛠️

### Verificar la instalación de Node.js
Antes de comenzar, asegúrate de tener Node.js instalado en tu sistema. Puedes verificar si Node.js está instalado ejecutando el siguiente comando en tu terminal:
```
node -v
```
Si Node.js está instalado, este comando mostrará la versión actual de Node.js. Si no está instalado, puedes descargar e instalar Node.js desde el [sitio oficial de Node.js](https://nodejs.org/en/download).

### Clonar el repositorio
Para clonar este repositorio
```
git clone https://github.com/ericksgv/WebScrapingThreads
```
### Instalar las dependencias
```
npm install @threadsjs/threads.js
```
```
npm install dotenv
```
### Configuración del Archivo .env

1. En la raíz de tu proyecto, crea un nuevo archivo llamado `.env`.

2. Abre el archivo `.env` en tu editor de texto preferido.
 
 3. **Definir las variables de entorno**:
  - Para configurar tu nombre de usuario, agrega la siguiente línea al archivo `.env` y reemplaza `tu_nombre_de_usuario` con tu nombre de usuario de Threads:
    ```plaintext
    USUARIO="tu_nombre_de_usuario"
    ```
  - Para configurar tu contraseña, agrega la siguiente línea al archivo `.env` y reemplaza `tu_contraseña` con tu contraseña de Threads:
    ```plaintext
    CONTRASENA="tu_contraseña"
    ```
   - Para configurar el perfil de Threads del que se extraerán los posts, agrega la siguiente línea al archivo `.env` y reemplaza `tu_perfil_de_threads` con el perfil de Threads que deseas utilizar:
     ```plaintext
     PERFILTHREADS="tu_perfil_de_threads"
     ```
 4. Guarda los cambios realizados en el archivo `.env`.
## Uso 📦
1. Ejecutar [obtenerPosts.js](./obtenerPosts.js).
   
     ```
     node obtenerPosts.js
     ```
     El JSON con los posts se almacenarán en el archivo [Posts.json](./Posts.json).
2. Ejecutar [extraerIdsPosts.js](./extraerIdsPosts.js).
   
     ```
     node extraerIdsPosts.js
     ```
     A partir del archivo [Posts.json](./Posts.json) se extraen los IDs de los posts y se almacenan en el archivo [idsPosts.txt](./idsPosts.txt).
3. Ejecutar [obtenerComentarios.js](./obtenerComentarios.js).
   
     ```
     node obtenerComentarios.js
     ```
      A partir del archivo [idsPosts.txt](./idsPosts.txt) se obtienen los IDs de los posts y se extraen los comentarios por cada página de cada post en los archivos `PaginaComentariosPost_{tokenSiguientePagina}.json`.
4. Ejecutar [extraerComentarios.js](./extraerComentarios.js).
   
     ```
     node extraerComentarios.js
     ```
     A partir de los archivos `PaginaComentariosPost_{tokenSiguientePagina}.json` se extrae el texto de los comentarios y se guardan en el archivo [comentarios.txt](./comentarios.txt).

## Autores ✒️
* **Santiago Mejía** - [SantiagoMejiaF](https://github.com/SantiagoMejiaF)
* **Ana Ortegón** - [Arsete](https://github.com/Arsete)
* **Felipe García** - [felipe0525](https://github.com/felipe0525)
* **Santiago Gallo** - [KironStylo](https://github.com/KironStylo)
* **Erick Garavito** - [ericksgv](https://github.com/ericksgv)

## Tecnologías
<img align="left" alt="Nodejs" width="76px" src="https://user-images.githubusercontent.com/25181517/183568594-85e280a7-0d7e-4d1a-9028-c8c2209e073c.png" /> 
<img align="left" alt="JavaScript" width="76px" src="https://raw.githubusercontent.com/jmnote/z-icons/master/svg/javascript.svg" /> 

<br>
<br>
<br>


## Licencia 📄
Este proyecto está bajo la licencia [MIT](./LICENSE).

