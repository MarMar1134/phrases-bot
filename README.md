# Laucha Acosta Bot

Aplicacion de Reddit construida con Devvit que responde automaticamente a
comentarios y publicaciones cuando el texto contiene una mencion de Laucha
Acosta. La respuesta se elige aleatoriamente de una lista de frases y cada
comentario o publicacion se procesa como maximo una vez.

## Como funciona

La aplicacion registra dos triggers en `devvit.json`:

- `onCommentSubmit`: se ejecuta cuando se publica un comentario.
- `onPostSubmit`: se ejecuta cuando se publica una publicacion.

En ambos casos el flujo es el siguiente:

1. Devvit envia el evento al endpoint correspondiente de
   `src/routes/triggers.ts`.
2. La aplicacion obtiene el ID y el texto del comentario o el titulo de la
   publicacion.
3. Comprueba en Redis si ese ID ya fue respondido.
4. Evalua el texto con este regex:

   ```regex
   /\b(el\s+laucha|lautaro\s+acosta|laucha\s+acosta|al\s+laucha)\b/i
   ```

5. Si hay coincidencia, selecciona una frase al azar y la publica como
   respuesta.
6. Guarda el ID en Redis con la clave
   `laucha:answered:<id>` para evitar respuestas duplicadas.

Si el texto no coincide, la aplicacion no publica ninguna respuesta. Los
errores de lectura del evento, de Redis o de Reddit se registran en los logs
de la aplicacion.

## Que detecta el regex

El modificador `i` hace que la busqueda no distinga mayusculas de minusculas.
Los limites `\b` evitan que la coincidencia forme parte de otra palabra y
`\s+` permite uno o mas espacios entre los terminos.

Por ejemplo, se detectan:

- `el Laucha`
- `EL LAUCHA`
- `Lautaro Acosta`
- `laucha    acosta`
- `Al Laucha`

No se detectan menciones incompletas como `Lautaro` o `Acosta` por separado.
Actualmente el regex se aplica al cuerpo de los comentarios y al titulo de las
publicaciones; no se analiza el cuerpo de una publicacion.

## Frases disponibles

Cuando hay una coincidencia, la aplicacion elige una de estas frases:

1. `es todo lo que yo no soy`
2. `Madurar es alcanzar un equilibrio, y en ese camino estoy, aprendiendo, escuchando a los que saben`
3. `Los jugadores de fútbol vivimos dentro de una burbuja`
4. `Mi ídolo no es ni Maradona, ni Messi... ¿Sabés quién es mi ídolo? Batistuta`
5. `No unifican criterios`
6. `Es un referí complicado. Depende quién lo necesite, dirige Hernán`
7. `No hay que confundirse y creer que todos somos millonarios`
8. `La gambeta me salvó la vida, y hacer terapia, la carrera`

Para agregar, quitar o modificar respuestas, editar el arreglo `phrases` en
[`src/routes/triggers.ts`](src/routes/triggers.ts). La eleccion es aleatoria y
todas las frases tienen la misma probabilidad.

## Requisitos

- Node.js `24` o superior.
- Una cuenta de Reddit con acceso a Devvit.
- Un subreddit de desarrollo para probar la aplicacion.
- Permisos de Reddit y Redis, declarados en `devvit.json`.

## Instalacion y desarrollo local

Desde la carpeta [`laucha-bot`](.):

```bash
npm install
npm run login
```

Configurar el subreddit de prueba en `devvit.json`:

```json
{
  "dev": {
    "subreddit": "nombre_del_subreddit"
  }
}
```

Luego iniciar el playtest:

```bash
npm run dev
```

Con el playtest activo, publicar un comentario o una publicacion cuyo texto o
titulo contenga una de las expresiones detectadas. La respuesta y los errores
se pueden revisar en los logs de Devvit.

## Comandos disponibles

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia el playtest de Devvit. |
| `npm run build` | Compila el servidor y los recursos con Vite. |
| `npm run test:types` | Ejecuta el chequeo de tipos de TypeScript. |
| `npm run test:unit` | Ejecuta los tests unitarios existentes. |
| `npm run lint` | Ejecuta ESLint sobre el codigo fuente. |
| `npm run deploy` | Verifica tipos, ejecuta ESLint y sube la app a Devvit. |
| `npm run launch` | Despliega y publica la app para el proceso de revision. |
| `npm run login` | Inicia sesion en la CLI de Devvit. |
| `npm run prettier` | Formatea los archivos del proyecto. |

Antes de desplegar, se recomienda ejecutar:

```bash
npm run test:types
npm run lint
npm run build
```

## Estructura relevante

```text
src/
├── index.ts              # Registra las rutas HTTP de la aplicacion
├── routes/
│   └── triggers.ts       # Regex, frases, deduplicacion y respuestas
└── assets/               # Recursos graficos de la aplicacion

devvit.json               # Triggers, permisos y subreddit de desarrollo
```

## Personalizacion

### Cambiar las frases

Editar `phrases` en `src/routes/triggers.ts`. Las frases deben ser strings y
se publican exactamente como estan escritas.

### Cambiar las menciones detectadas

Editar `matchingCases` en el mismo archivo. Si se cambia la expresion regular,
tener en cuenta que:

- `/i` mantiene la busqueda sin distinguir mayusculas.
- `\b` representa un limite de palabra.
- `\s+` permite espacios variables.
- Los parentesis separan alternativas con `|`.

### Cambiar el comportamiento de publicaciones

El trigger de publicaciones actualmente evalua solo `post.title`. Para
responder tambien segun el contenido de la publicacion habria que leer el
campo correspondiente del evento y combinarlo con el titulo antes de aplicar
`matchingCases`.

## Deduplicacion y Redis

La clave `laucha:answered:<id>` se guarda en Redis luego de publicar la
respuesta. Mientras esa clave exista, el mismo ID no vuelve a procesarse. Esto
evita respuestas repetidas si Reddit reenvia un evento o si el endpoint recibe
el mismo evento mas de una vez.

La deduplicacion es independiente para cada comentario y publicacion porque
utiliza su ID como parte de la clave. No se debe eliminar una clave durante una
prueba si se quiere conservar la garantia de una sola respuesta para ese
contenido.

## Despliegue

1. Probar la aplicacion en el subreddit configurado en `devvit.json`.
2. Confirmar que los triggers esten habilitados y que la cuenta tenga acceso.
3. Ejecutar `npm run deploy` para compilar, validar y subir la version.
4. Ejecutar `npm run launch` solo cuando la version este lista para publicar.

La aplicacion necesita los permisos `reddit` y `redis` declarados en
`devvit.json`. Si se cambia el nombre del subreddit o la configuracion de
Devvit, volver a desplegar la aplicacion.
