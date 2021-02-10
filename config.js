'use strict'

const config = {
  /* Para la configuración de google cloud
  aws (google cloud en este caso)
  */
  client: {
    endpoints: {
      pictures: 'http://api.portafolio_digital.com/picture',
      users: 'http://api.portafolio_digital.com/user',
      auth: 'http://api.portafolio_digital.com/auth'
    }
  },
  secret: process.env.PORTAFOLIO_SECRET || 'p0rt4f0l10'
}

//  Con esta condición definimos que si la variable de entorno es diferente a producción, entonces que me tome la configuración de desarrollo
if (process.env.NODE_ENV !== 'production') {
  config.client.endpoints = {
    pictures: 'http://localhost:5000',
    users: 'http://localhost:5001',
    auth: 'http://localhost:5002'
  }
}

module.exports = config