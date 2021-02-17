const express = require('express');
const multer = require('multer');
const ext = require('file-extension');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const passport = require('passport');
const portafolio = require('portafolio_digital-client');
const auth = require('./auth');
const morgan = require('morgan');
const config = require('./config');
const port = process.env.PORT || 5050;

//  Para instanciarlo
let client = portafolio.createClient(config.client);


let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, +Date.now() + '.' + ext(file.originalname))
  }
})

let upload = multer({ storage: storage }).single('picture');

const aplication = express();

//  buscamos que cada petición que haga http request venga de formato json sea entendible
aplication.use(bodyParser.json());
aplication.use(bodyParser.urlencoded({ extended: false }));
aplication.use(cookieParser());
//  Indicamos el middleware de sesión con express-session
aplication.use(expressSession({
  secret: config.secret,
  //  para que no vuelva a guardar la sesión
  resave: false,
  //  y para que no almacene sesiones que no han sido inicializada
  saveUninitialized: false
}));

//  después de implementar los middleware que irán paso a paso en express, vamos a inicializar passport
aplication.use(passport.initialize());
//  y le decimos a express que nos defina las sesiones
aplication.use(passport.session());

//PARA INDICARLE AL SERVIDOR QUE UTILIZAREMOS UN MOTOR DE PLANTILLA.
aplication.set('view engine', 'pug');

//Middleware
aplication.use(morgan('dev'));

//En esta línea, le estamos indicando al framework de express que nos devuelva lo que el usuario esté mandando en un input text o textarea y así lo puede entender el sv.
aplication.use(express.urlencoded({extended: false}));

//DEFINIRLE UN NUEVO MIDDLEWARE Y SIRVE PARA UTILIZAR UN ARCHIVO ESTATICO EN ESTE CASO SERÍA COMO UNA CARPETA VIRTUAL "PUBLIC".
aplication.use(express.static('public'))

//Después de todos los middleware que tenemos en nuestra aplicación le pasaremos la estrategia de registro
passport.use(auth.localStrategy);
passport.use(auth.facebookStrategy);
passport.deserializeUser(auth.deserializeUser);
passport.serializeUser(auth.serializeUser);

//EN ESTE CASO SE DEFINEN LAS RUTAS QUE HACER PARTE DE NUESTRO PROYECTO E INDICANDO EL OBJETO PARA EL TÍTULO DE NUESTRA PÁGINA.
aplication.get('/', function (req, res) {
    res.render('index', { title: 'Portafolio'});
});

aplication.get('/signup', function (req, res) {
    res.render('index', { title : 'Portafolio - Signup'});
});

//  creamos una petición http de tipo post y obtiene el usuario del request body. Y eso se debe a que utilizamos el middleware de body-parser ya el objeto me llegará ya procesado
aplication.post('/signup', function (req, res) {
  let user = req.body;
  client.saveUser(user, function (err, usr) {
    if (err) return res.status(500).send(err.message)

    //  y si todo esta bien, vamos a hacer una redirección a nuestro login
    res.redirect('/signin');
  });
});

aplication.get('/signin', function (req, res) {
    res.render('index', { title : 'Portafolio - Signin'});
});

aplication.post('/login', passport.authenticate('local', {
  //Cuando nuestro login sea exitoso vamos a ir a la ruta inicial
  successRedirect: '/',
  //Si falló algo vamos a redireccionar al formulario signin
  failureRedirect: '/signin'
}));

aplication.get('/logout', function (req, res) {
  req.logout();

  res.redirect('/');
});

//En la parte en donde está el "scope", significa qué permisos me va a brindar la estrategia de facebook para autenticar y qué necesito con respecto al permiso del usuario, en este caso el email.
aplication.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

aplication.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/signin'
}));

//creamos una función que nos va a garantizar si el usuario fue creado o no
function ensureAuth (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.status(401).send({ error: 'no esta autenticado' })
}

aplication.get('/whoami', function (req, res) {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }

  res.json({ auth: false })
});

//(FIXEAR EL PROBLEMA DE SINCRONIZACIÓN DE PAGE CON LA LIBRERIA TITLE)
aplication.get('/api/pictures', function (req, res){
  /* EN ESTE CASO PONDREMOS UN OBJETO CON LOS DATOS, ICONOS Y USUARIO QUIEN SUBIÓ LA FOTO
 EN LA PROPIEDAD "creatAt" CREAMOS UNA NUEVA INSTANCIA DE LA CLASE Date, EN DONDE SIGNIFICA 'new Date()' Hoy*/
  const pictures = [
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.png'
    },
    url: 'certificado.png',
    likes: 0,
    liked: false,
    createAt: new Date()
  },


  /* EN LA LÍNEA 34, PRIMERO CREAMOS UNA NUEVA INSTANCIA DE LA CLASE "Date()", ENVIÁNDOLE COMO MÉTODO LA FUNCIÓN QUE NOS PERMITE MODIFICAR O CAMBIAR LA HORA ".setDate(new Date().getDate() - 10)" Y DENTRO COMO PARÁMETRO SE LE ENVIA LA FECHA ACTUAL CON "new Date()" Y DESPUÉS DE OBTENER EL DÍA DE HOY CON LA FUNCIÓN "getDate()" LE RESTAMOS LOS DÍAS QUE QUEREMOS.  */
  {
    user: {
      username: 'jmontilla',
      avatar: 'fotoperfil.png'
    },
    url: 'https://materializecss.com/images/office.jpg',
    likes: 0,
    liked: false,
    createAt: new Date()
  },
  ];

  setTimeout(function () {
  res.send(pictures);
  }, 2000);
});

aplication.post('/api/pictures', ensureAuth, function (req, res) {
  upload(req, res, function (err){
    if (err) {
      return res.send(500, "Error al subir archivo");
    }
    res.send('Archivo subido correctamente');
  })
});

aplication.get('/api/user/:username', function (req, res){
  const user = {
    username: 'jmontilla',
    avatar: 'fotoperfil.png',
    pictures: [
      {
        id: 1,
        src: 'certificado.png',
        likes: 12
      },
      {
        id:2,
        src: 'servicio_comunitario_2.jpg',
        likes: 11
      },
       {
        id:3,
        src: 'muestra_trabajo.jpg',
        likes: 10
      },
       {
        id:4,
        src: 'muestra_trabajo_2.jpg',
        likes: 13
      },
       {
        id:5,
        src: 'muestra_trabajo_3.jpg',
        likes: 14
      },
       {
        id:6,
        src: 'muestra_trabajo_4.jpg',
        likes: 15
      },
    ]
  }
  res.send(user);
});

//RUTA PARA EL USUARIO
aplication.get('/:username', (req, res)=>{
    res.render('index', { title : `Portafolio - ${req.params.username}`});
});

//RUTA PARA LAS FOTOS DE LOS USUARIOS
aplication.get('/:username/:id', (req, res)=>{
    res.render('index', { title : `Portafolio - ${req.params.username}`});
});


/* CON ESA CONDICIÓN ESTAMOS INDICANDO QUE SI ERROR ES DIFERENTE A NULL ENTONCES LA APLICACIÓN ME RETORNE NADA DE LO CONTRARIO ME MUESTRE UN MENSAJE EN CONSOLA DICIENDO QUE HUBO UN ERROR, "process.exit(1)" NOS SIRVE PARA INDICAR QUE SI HAY UN ERROR DETENGA LA APLICACIÓN DE NO HABER SIEMPRE DEBE SER DISTINTO QUE "0". */

aplication.listen(port, function (err) {
    if (err) {
      console.error('hubo un error')
      process.exit(1);
    }

    console.log(`Portafolio Digital escuchando en el puerto ${port} ¡Servidor arriba!`);
});

/*LAS FUNCIONES PUEDEN O NO TENER UN NOMBRE, ES POR ESO QUE VEMOS QUE EN LOS ARROW FUNCTION NO SE LE COLOCA UN NOMBRE. ()=>*/

//PASAMOS EL ARRAY A EL TEMPLATE DE LA HOMEPAGE
