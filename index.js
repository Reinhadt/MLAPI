require('./config/misc')
require('./cron/jobs')

require('dotenv').config()
const express = require('express');
const app = express();
const mongoose = require('mongoose')
const path  = require('path')
const option = {
    socketTimeoutMS: 30000,
    keepAlive: true,
    reconnectTries: 30000
}

//set the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(require('./routes/index'))

app.get('/', (req, res) => {
    res.json({
        ok: true,
        info: "Api de desdoblamiento de datos de MercadoLibre."
    })
})

mongoose.connect(process.env.URLDB, option, (err, res) =>{
    if(err) throw err;
    console.log('ROCANROLDB')
});

app.listen(process.env.PORT || 5000, () =>{
    console.log('ACANDAMOS')
})

app.get('*', (req, res)=>{
    res.json({
        ok: false,
        info: "Esta URL no contiene nada :("
    })
})
app.timeout = 1200000;