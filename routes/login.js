const express = require('express');
const request = require('request');
const rp      = require('request-promise');
const app     = express();
const meli    = require('mercadolibre');
const config  = require('../config/config')
const misc    = require('../config/misc')
const Usuarios = require('../classes/userT');
const Drive   = require('../classes/transact');
const u       = new Usuarios()
const {userDataGetter} = require('../utils/utils')

const {Usuario} = require('../models/users')

app.get('/:marca/login', (req, res) =>{

    //Pásale el config de la marca por parámetro a una clase o función
    //ésta ejecuta el /auth y de ahí jalo el app_id y el secret
    //toma como ejemplo la de shopify

    let marca = req.params.marca

    //let empresa = config[marca]

    u.agregarUserT(marca)

    //let meliObject = new meli.Meli(empresa.app_id, empresa.secret)

    res.redirect(`http://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=${process.env.CLIENT_ID}`)
})

app.get('/login', (req, res) =>{
    res.redirect(`http://auth.mercadolibre.com.mx/authorization?response_type=code&client_id=${process.env.CLIENT_ID}`)
})


app.get('/auth', (req, res) => {
    let codigo = req.query.code


    request.post(`https://api.mercadolibre.com/oauth/token?grant_type=authorization_code&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${codigo}&redirect_uri=${process.env.API_URL}/auth`, (err, response, body)=>{
        if(!err){

            let b = JSON.parse(response.body)
            console.log("ACCESS TOKEN: ", b.access_token)
            console.log("USER ID: ", b.user_id)

            //ACÁ SE OBTIENE EL NOMBRE DEL VATO
            userDataGetter(Number(b.user_id))
                .then(r => {
                    console.log("USERNAME: ", r.nickname)
                    let noSP = r.nickname.split(' ').join('_')

                    let usuario  = new Usuario({
                        nombre: noSP,
                        friendly_name: r.nickname,
                        app_id: process.env.CLIENT_ID,
                        secret: process.env.CLIENT_SECRET,
                        access_token: b.access_token,
                        token_type: b.token_type,
                        user_id: b.user_id,
                        refresh_token: b.refresh_token
                    })

                    Usuario.findOne({ nombre: noSP }, (err, usuarioDB) => {
                        if(err){
                            return res.status(400).json({
                                ok: false,
                                err
                            })
                        }

                        if(usuarioDB){
                            return res.json({
                                ok: false,
                                resp: "El usuario ya existe"
                            })
                        }else{
                            usuario.save((err, usuarioDB) => {
                                if(err){
                                    return res.status(400).json({
                                        ok: false,
                                        err
                                    })
                                }else{
                                    console.log("ELUSUARIO: ", usuarioDB)
                                    rp(`${process.env.API_URL}/itemsDB`)
                                        .then((r) => {
                                            res.redirect(`/welcome/${usuarioDB.nombre}`)
                                        })
                                        .catch((err) => {
                                            throw err
                                        })

                                    /* res.json({
                                        ok: true,
                                        usuario: usuarioDB
                                    }) */
                                }
                            })
                        }
                    })
                })

        }else{
            res.json({
                ok: false,
                resp: err
            })
        }
    })
})


module.exports = app