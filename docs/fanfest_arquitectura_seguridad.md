# Arquitectura y Seguridad: FanFest Digital 5.0

Para garantizar que FanFest Digital 5.0 ofrezca una experiencia ininterrumpida, rápida y completamente segura durante los picos de tráfico masivo que caracterizan a los eventos mundiales, hemos construido la plataforma sobre una arquitectura "Serverless" y de "Edge Computing" de última generación.

Nuestros socios comerciales e institucionales pueden tener la absoluta certeza de que sus datos, las interacciones de sus clientes y la estabilidad de sus activaciones de marca están respaldadas por infraestructuras de nivel empresarial.

---

## 1. Arquitectura Frontend (Velocidad y Disponibilidad Global)

El cliente web que interactúa con los usuarios está construido para ofrecer tiempos de carga casi instantáneos y soportar tráfico extremo.

*   **Tecnología Core:** React + TypeScript, empaquetado con Vite. Esto garantiza una aplicación de página única (SPA) extremadamente ligera, rápida y libre de errores de tipado gracias a TypeScript.
*   **Edge Network (Vercel):** La aplicación está desplegada en Vercel, utilizando su red global de Edge. Esto significa que la aplicación no reside en un solo servidor, sino que se distribuye geográficamente en nodos de todo el mundo. Si un usuario se conecta desde España o Colombia, descarga la plataforma desde el servidor físicamente más cercano a él.
*   **Alta Disponibilidad (99.99% Uptime):** Al no depender de servidores web tradicionales (como Apache o Nginx), eliminamos los puntos únicos de falla. La infraestructura de Vercel escala automáticamente y de forma instantánea ante cualquier pico de tráfico, garantizando que la plataforma nunca "se caiga" durante un partido importante.

## 2. Arquitectura Backend y Base de Datos (Supabase)

Toda la lógica de datos, perfiles, quinielas y sorteos se gestiona a través de **Supabase**, una alternativa de código abierto a Firebase, construida sobre PostgreSQL, el motor de base de datos relacional más avanzado y robusto del mundo.

*   **PostgreSQL:** Garantiza la integridad referencial y transaccional absoluta de los datos. A diferencia de las bases de datos NoSQL, aquí no hay pérdida de consistencia. Cada punto, quiniela o ticket se registra de forma inmutable.
*   **Realtime Sockets:** Utilizamos las capacidades de *WebSockets* de Supabase para que las actualizaciones (como el Bingo VAR o cambios en las puntuaciones de la quiniela) se reflejen en las pantallas de los usuarios en tiempo real, sin necesidad de recargar la página.
*   **Almacenamiento (Storage):** Las imágenes, logos de patrocinadores y avatares se almacenan en Supabase Storage, servidos a través de una CDN inteligente para minimizar el consumo de ancho de banda y acelerar la carga visual.

## 3. Infraestructura de Seguridad y Privacidad

La seguridad de los datos de nuestros usuarios y la transparencia de las dinámicas comerciales son nuestra máxima prioridad.

*   **Autenticación y JWT:** Todos los usuarios se autentican de forma segura. El sistema emite JSON Web Tokens (JWT) que validan cada petición al servidor, asegurando que un usuario solo pueda acceder o modificar su propia información.
*   **Row Level Security (RLS):** Esta es la capa de defensa más poderosa de nuestra base de datos. RLS asegura a nivel de motor de base de datos que:
    *   Un usuario solo pueda ver sus propios datos personales.
    *   Un promotor solo pueda ver y gestionar a los miembros de sus propias quinielas.
    *   Los datos críticos (como resultados de partidos o ganadores de sorteos) solo puedan ser modificados por cuentas de administrador con roles específicos.
*   **Exención de Responsabilidad y Términos:** El proceso de *Onboarding* forzoso registra de forma auditable la aceptación de términos, condiciones y exenciones de responsabilidad. La plataforma actúa como un proveedor tecnológico (Hub), blindando legalmente al FanFest respecto a acuerdos privados entre gestores y participantes.

## 4. Estabilidad en Activaciones de Marca (Promociones 5.0)

Para las herramientas de Promociones 5.0 (Bingo VAR y Ciclón Mundialista), la seguridad criptográfica es clave:

*   **Tickets y QR Criptográficos:** Los tickets generados para los sorteos poseen identificadores únicos (UUIDv4) que hacen imposible su falsificación o adivinación. 
*   **Escaneo Seguro:** El sistema de validación del Ciclón requiere que el promotor escanee el código directamente conectado al backend en tiempo real para verificar su autenticidad y estado ("usado" o "válido"), previniendo cualquier tipo de fraude o doble uso en activaciones de marca.

---

**Conclusión:**
FanFest 5.0 no es un simple sitio web interactivo. Es una arquitectura distribuida de nivel corporativo que garantiza una experiencia de usuario impecable bajo estrés extremo, blindada por políticas de seguridad estrictas desde la base de datos hasta el cliente final.
