const express = require('express');
const request = require('request');
const router  = express.Router();
const config  = require('../config/config')
const misc    = require('../config/misc')
const Drive   = require('../classes/transact');
const Usuarios= require('../classes/userT');
const u       = new Usuarios()

const {Usuario} = require('../models/users')

router.get('/:marca/:endpoint', u.obtieneUsuario, (req, res) => {

            let m = req.obtiene
            console.log(m)
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
                    console.log("USUARIODB: ", usuarioDB[0])

                    drive = new Drive(usuarioDB[0])

                    drive.getData(req.params.endpoint, limite, pagina)
                        .then(r => res.json(r))
                        .catch(err => {
                            console.log("elerrorcillo: ", err)
                        })
                }
            })
})


router.get('/ordenes/ordenesScroll/:marca', u.obtieneUsuario, (req, res) => {
    console.log("MARCOTA: ", req.params.marca)
    let m = req.obtiene
    console.log(m)
    let drive

    let limite = 5000
    let pagina = null

    if(req.query.limite){
        limite = 5000
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
            console.log(usuarioDB[0])

            drive = new Drive(usuarioDB[0])

            drive.getDataScroll("ordersScroll", limite, pagina)
                .then(r => res.json(r))
                .catch(err => {
                    console.log("elerrorcillo: ", err)
                })
        }
    })
})

module.exports = router