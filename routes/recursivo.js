const express = require('express');
const request = require('request');
const rp = require('request-promise');
const app     = express();
const config  = require('../config/config')
const misc    = require('../config/misc')
const Drive   = require('../classes/transact');
const Usuarios= require('../classes/userT');
const u       = new Usuarios()

const {Usuario} = require('../models/users')


app.get('/:marca/items/:endpoint', u.obtieneUsuario, (req, res) => {
    let m = req.obtiene
    console.log(m.user_id)
    let drive

    let limite = null
    let pagina = null

    if(req.query.limite){
        limite = req.query.limite
    }
    if(req.query.pagina){
        pagina = req.query.pagina
    }

    //pasar función a clase con parámetros y usar el controlador?
    let usuario = Usuario.find({ user_id: m.user_id }, (err, usuarioDB) => {
        if(err){
            return res.status(500).json({
                ok: false,
                err
            })
        }else{
            //console.log(usuarioDB[0])

            drive = new Drive(usuarioDB[0])
            let total
            drive.getData(req.params.endpoint, limite, pagina)
                .then(r => {
                    let promesas = []
                    let arregloRes
                    let a = r.results
                    total = r.totalReal


                    for(let i = 0; i<a.length; i++){
                        let peticion = rp(`${process.env.BASE_URL}/items/${a[i]}`)
                        promesas.push(peticion)

                    }

                    Promise.all(promesas)
                    .then( promesa => {
                        let arr = [];
                        let arregloRes = promesa.map( (p, index) => {
                            let parce = JSON.parse(p);

                            return parce;
                        })

                        res.json({"totalReal": total, "totalActual": arregloRes.length, "results": arregloRes})

                    })
                    .catch( err => {
                        console.log(err)
                    })

                })
                .catch(err => {
                    console.log("elerrorcillo: ", err)
                })
        }
    })
})

module.exports = app