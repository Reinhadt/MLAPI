const express = require('express');
const app = express()

app.use(require('./login'))
app.use(require('./envios'))
app.use(require('./categorias'))
app.use(require('./productos'))
app.use(require('./recursivo'))
app.use('/po', require('./po'))
app.use('/welcome', require('./views'))
app.use('/visitas', require('./visitas'))

module.exports = app