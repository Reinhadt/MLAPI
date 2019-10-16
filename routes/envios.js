const express = require('express');
const request = require('request');
const rp = require('request-promise');
const app     = express();
const interval= require('interval-promise')
const config  = require('../config/config')
const misc    = require('../config/misc')
const Drive   = require('../classes/transact');
const Usuarios= require('../classes/userT');
const u       = new Usuarios()

const {Usuario, Items} = require('../models/users')

app.get('/:marca/envios', u.obtieneUsuario, (req, res) =>{

    let m = req.obtiene
    let d = new Drive()

    let limite = 100
    let pagina = 0
    let marca = req.params.marca

    if(req.query.limite){
        limite = Number(req.query.limite)
    }
    if(req.query.pagina){
        pagina = Number(req.query.pagina)
    }

    Usuario.findOne({user_id: m.user_id}, (err, usuarioDB) => {
        if(err){
            res.json({
                "ERR": err
            })
        }else{
            request.get(`${process.env.API_URL}/${marca}/orders?limite=${limite}&pagina=${pagina}`, (err, resp, body) => {

                if(err){
                    res.json({
                        error:  err
                    })
                }

                console.log("ENVIOS REQ: ", resp.body)
                let resultado = JSON.parse(resp.body)
                let arr = []

                resultado.results.map((el) => {

                    let peticion = rp(`${process.env.BASE_URL}/shipments/${el.shipping.id}?access_token=${usuarioDB.access_token}`)
                    arr.push(peticion)
                })

                Promise.all(arr)
                .then( promesa => {
                    let arr = [];
                    let arregloRes = promesa.map( (p, index) => {
                        let parce = JSON.parse(p);

                        return parce;
                    })

                    res.json({"totalActual": arregloRes.length, "results": arregloRes})

                })
                .catch( err => {
                    console.log(err)
                })
            })
        }
    })

})

module.exports = app