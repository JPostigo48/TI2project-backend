# Academic System Backend (Node.js + Express + MongoDB)

Este repositorio contiene el código base del servidor para el sistema web académico interno de la Escuela de Ciencia de la Computación. La aplicación está construida sobre Node.js utilizando Express como framework HTTP y Mongoose para interactuar con MongoDB. Se ha diseñado con una estructura modular y escalable que sigue buenas prácticas de ingeniería software: separación de responsabilidades, arquitectura por capas y uso de middlewares para autenticación y autorización.

## 🎯 Objetivo

El backend gestiona funcionalidades como autenticación, gestión de usuarios, carga inicial de datos, inscripción y asignación de laboratorios, registro de asistencia, registro de calificaciones, reservas de aulas, generación de reportes y consultas varias, de acuerdo con el análisis de requisitos proporcionado.

## 📂 Estructura de carpetas

La estructura del proyecto se basa en la separación de responsabilidades recomendada para aplicaciones Node.js escalables. La documentación de MDN indica que es conveniente crear una carpeta de `controllers` independiente para cada modelo y exportar funciones que manejen las solicitudes【28183314200174†L614-L621】. El artículo “Bulletproof node.js project architecture” propone una estructura de carpetas con capas independientes para rutas, configuraciones, modelos y servicios【704369511707041†L74-L91】 y recomienda no colocar la lógica de negocio dentro de los controladores【704369511707041†L95-L116】. A partir de estas recomendaciones se ha organizado el proyecto de la siguiente manera:

```text
academic-backend/
├── src/
│   ├── app.js              # Configuración de Express y registro de rutas
│   ├── server.js           # Punto de entrada; arranca el servidor
│   ├── config/
│   │   └── db.js           # Conexión a MongoDB
│   ├── models/             # Esquemas de Mongoose (User, Course, Section, etc.)
│   ├── controllers/        # Controladores que reciben peticiones y responden
│   ├── routes/             # Definición de rutas API agrupadas por recurso
│   ├── middlewares/        # Middlewares de autenticación y autorización
│   ├── services/           # Lugar sugerido para la lógica de negocio futura
│   └── utils/              # Funciones auxiliares (PDF, importación, etc.)
├── .env.example            # Plantilla de variables de entorno
├── package.json            # Dependencias y scripts
└── README.md               # Documentación del proyecto
```

### Variables de entorno

La gestión de variables sensibles se realiza mediante la librería `dotenv`. El uso de variables de entorno evita exponer secretos en el código fuente y facilita la configuración por entorno de ejecución. La documentación de Vonage indica que Dotenv carga variables definidas en un archivo `.env` dentro del objeto `process.env`, permitiendo acceder a ellas de forma segura en la aplicación【708683491857864†L67-L80】. El archivo `.env` no debe subirse al repositorio; en su lugar se proporciona `.env.example`【708683491857864†L217-L223】.

**Variables definidas en `.env`:**

| Clave           | Descripción                                               |
|-----------------|-----------------------------------------------------------|
| `PORT`          | Puerto donde se ejecutará el servidor.                   |
| `MONGO_URI`     | Cadena de conexión a MongoDB.                            |
| `JWT_SECRET`    | Clave secreta para firmar los tokens JWT.                 |
| `NODE_ENV`      | Entorno de ejecución (`development` o `production`).      |

## ✅ Requisitos de instalación

1. Tener instalado Node.js (versión 18+).
2. Tener acceso a una base de datos MongoDB (local o remota).
3. Clonar este repositorio y renombrar `.env.example` a `.env`, ajustando los valores.
4. Ejecutar `npm install` para instalar las dependencias.
5. Para desarrollo local, ejecutar `npm run dev` para iniciar con nodemon. En producción se debe utilizar `npm start`, que ejecuta Node sin reinicio automático.

```bash
git clone <este-repo>
cd academic-backend
cp .env.example .env
npm install
npm run dev # o npm start
```

## 🔒 Seguridad y buenas prácticas

* **Organización modular**: los controladores se agrupan por recurso, los modelos representan las entidades de dominio y los middlewares encapsulan funcionalidades transversales. Esta organización concuerda con la separación de preocupaciones recomendada en la documentación de Node y Express【28183314200174†L614-L621】【704369511707041†L95-L116】.
* **Capa de servicios**: aunque los controladores implementan cierta lógica básica, se ha reservado una carpeta `services/` para mover allí la lógica de negocio compleja. La arquitectura de tres capas propuesta en la bibliografía sugiere que el servicio encapsule las operaciones de negocio y que los controladores se limiten a delegar y responder【704369511707041†L95-L116】【704369511707041†L155-L170】.
* **Middleware de autenticación**: se usa JWT para autenticar las solicitudes. El middleware `protect` valida el token y carga la información del usuario; `authorize` limita el acceso según roles.
* **Gestión de configuraciones**: mediante Dotenv y el archivo `.env` se centralizan credenciales y configuraciones externas. La práctica de no comprometer estos datos en el repositorio se destaca en la documentación consultada【708683491857864†L67-L80】.

## 🧩 API Restful: rutas y funcionalidades

A continuación se describen los principales endpoints disponibles, el rol autorizado y una breve descripción. Todos los endpoints están prefijados con `/api`.

### Autenticación

| Método y ruta              | Roles autorizados   | Descripción                                                          |
|---------------------------|---------------------|----------------------------------------------------------------------|
| `POST /api/auth/login`    | Público            | Inicia sesión con email y contraseña. Devuelve un token JWT y datos básicos del usuario. |
| `POST /api/auth/register` | `admin`            | Crea un nuevo usuario indicando nombre, email, contraseña, rol y código. |

### Usuarios

| Método y ruta               | Roles autorizados               | Descripción                                                        |
|----------------------------|---------------------------------|--------------------------------------------------------------------|
| `GET /api/users`           | `admin`                          | Listar todos los usuarios registrados (sin contraseñas).            |
| `GET /api/users/:id`       | `admin` o usuario mismo         | Obtener datos de un usuario específico.                             |
| `PUT /api/users/:id`       | `admin` o usuario mismo         | Actualizar información básica del usuario (excepto contraseña).      |
| `DELETE /api/users/:id`    | `admin`                          | Desactivar la cuenta de un usuario (soft delete).                   |

### Cursos y secciones

| Método y ruta                                | Roles autorizados                       | Descripción                                                                               |
|---------------------------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------|
| `GET /api/courses`                          | `admin`, `secretary`, `teacher`, `student` | Listar todos los cursos.                                                                  |
| `POST /api/courses`                         | `admin`, `secretary`                     | Crear un nuevo curso.                                                                     |
| `PUT /api/courses/:id`                      | `admin`, `secretary`                     | Actualizar un curso existente.                                                            |
| `DELETE /api/courses/:id`                   | `admin`, `secretary`                     | Eliminar un curso.                                                                        |
| `GET /api/courses/:id/sections?semester=`   | Todos                                    | Obtener las secciones asociadas a un curso (puede filtrarse por semestre).                |

### Inscripción y asignación a laboratorios

| Método y ruta                                | Roles autorizados           | Descripción                                                                                                      |
|--------------------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------|
| `POST /api/labs/groups`                    | `secretary`                | Crear un grupo de laboratorio (sección de tipo “lab”) indicando curso, semestre, horario, docente, aula y aforo. |
| `GET /api/labs/groups?course=&semester=`   | `student`, `secretary`, `teacher` | Listar grupos de laboratorio de un curso en un semestre determinado.                                             |
| `POST /api/labs/preferences`               | `student`                  | Registrar las preferencias de horarios del estudiante para la inscripción a laboratorios.                         |
| `POST /api/labs/assign`                    | `secretary`                | Ejecutar el algoritmo de asignación automática de alumnos a grupos (aún no implementado).                        |

### Asistencia

| Método y ruta                                                  | Roles autorizados           | Descripción                                                                                     |
|---------------------------------------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------|
| `POST /api/attendance`                                        | `teacher`                  | Abrir una nueva sesión de asistencia para una sección. Se genera una lista de estudiantes con estado “ausente”. |
| `PATCH /api/attendance/:sessionId/entry/:studentId`            | `teacher`                  | Marcar la asistencia (presente/ausente/tarde) de un estudiante en una sesión existente.            |
| `GET /api/attendance?section=`                                 | `teacher`, `student`       | Listar todas las sesiones de asistencia, filtrables por sección.                                 |

### Calificaciones

| Método y ruta                          | Roles autorizados     | Descripción                                                                                                            |
|---------------------------------------|-----------------------|------------------------------------------------------------------------------------------------------------------------|
| `POST /api/grades`                    | `teacher`            | Crear o actualizar una nota para un estudiante en una evaluación determinada.                                          |
| `GET /api/grades?section=&summary=`   | `teacher`, `student` | Obtener todas las notas de una sección. Si `summary=true`, devuelve también estadísticas (máximo, mínimo, promedio).    |

### Aulas y reservas

| Método y ruta                                  | Roles autorizados             | Descripción                                                                                         |
|-----------------------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------|
| `GET /api/rooms`                              | Todos                          | Listar todas las aulas registradas.                                                                 |
| `POST /api/rooms`                             | `admin`                        | Crear una nueva aula.                                                                               |
| `POST /api/rooms/reserve`                     | `teacher`                     | Reservar un aula para actividades extra (valida solapamiento de horarios).                          |
| `GET /api/rooms/reservations?room=&date=`     | `teacher`, `admin`            | Consultar reservas existentes, filtrables por aula y fecha.                                         |

### Otras funcionalidades y módulos futuros

El análisis de requisitos describe otros módulos que aún no se han implementado completamente en este backend:

* **Carga inicial de datos**: Secretaría debe cargar plantillas Excel con alumnos, docentes, horarios y aulas, validando formatos y choques. Esto se puede implementar mediante utilidades de importación (por ejemplo, usando `csv-parser` o `xlsx`) y servicios que inserten en la base de datos.
* **Algoritmo de asignación a laboratorios**: pendiente de implementar. Debe priorizar por cruce, balancear aforos y sortear en caso de empate.
* **Exportación de reportes**: generación de PDFs de listados de alumnos, cargas docentes, notas finales y cronogramas. Se puede emplear una biblioteca como `pdfkit` o `puppeteer` para renderizar plantillas en PDF.
* **Panel de avance y desempeño**: cálculos de porcentaje de sesiones dictadas, riesgo por faltas o notas bajas, y un panel para visualizarlos.
* **Gestión de aulas y horarios avanzados**: validaciones de choques de horarios en tiempo real y visualización de disponibilidad.

## 🛠 Buenas prácticas y extensibilidad

* **Separar lógica de negocio**: la capa de controladores se enfoca en procesar la solicitud y devolver la respuesta, mientras que la lógica compleja debería moverse a la carpeta `services`. Esto sigue el principio de separación de responsabilidades y mejora la escalabilidad【704369511707041†L95-L116】.
* **Utilizar middlewares**: para la validación de datos de entrada (por ejemplo, con Joi), manejo de errores centralizados y otras funcionalidades transversales.
* **Implementar pruebas**: se recomienda añadir pruebas unitarias e integración para cada capa y usar herramientas como Jest o Mocha.
* **Adoptar una arquitectura desacoplada**: en un futuro se puede integrar un patrón Pub/Sub para tareas asíncronas (por ejemplo, envío de correos), siguiendo las sugerencias de arquitectura event-driven【704369511707041†L216-L227】.

## 📃 Licencia

Este proyecto se distribuye bajo la licencia MIT.

---

Para preguntas o sugerencias, por favor contacta al equipo de desarrollo.