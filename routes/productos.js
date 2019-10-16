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


app.get('/:marca/productos', u.obtieneUsuario, (req, res) => {

    //1. Tomar el resultado de la marca
    //2. Ir al config
    //3. Jalar la marca

        let m = req.obtiene
        console.log("EME: ", m)
        let d = new Drive()

        let limite = 100
        let pagina = 0

        if(req.query.limite){
            limite = Number(req.query.limite)
        }
        if(req.query.pagina){
            pagina = Number(req.query.pagina)
        }

        let skip = limite*pagina

        Usuario.findOne({user_id: m.user_id}, (err, usuarioDB) => {
            if(err){
                res.json({
                    "ERR": err
                })
            }else{

                Items.findOne({seller_id: usuarioDB.user_id}, (err, itemDB ) => {
                    if(err){
                        return res.status(400).json({
                            ok: false,
                            err
                        })
                    }
                    if(itemDB != null){
                        console.log("Access: ", usuarioDB.user_id)
                        console.log("Resutladotes: ", itemDB)
                        let a = itemDB.results

                        let iterable = a.slice(skip, skip+limite)

                        let promesas = []

                        for(let i = 0; i<iterable.length; i++){

                            let peticion = rp(`${process.env.BASE_URL}/items/${iterable[i]}?access_token=${usuarioDB.access_token}`)
                            promesas.push(peticion)

                        }

                        Promise.all(promesas)
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
                    }else{
                        return res.status(400).json({
                            ok: false,
                            err
                        })
                    }
                })

            }
        })




/*     request(`https://meliapi.herokuapp.com/${req.params.marca}/items?limite=${limite}&pagina=${pagina}`, (err, resp, body) => {
        let resultado = JSON.parse(resp.body)
        let a = resultado.results
        let promesas = []
        let arregloRes


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

            res.json({"totalActual": arregloRes.length, "results": arregloRes})

        })
        .catch( err => {
            console.log(err)
        })


    }) */
})

let getCantidad = (url) => {
    //poner validación para ver qué tipo de endpoint es y arreglar la url en consecuencia
    return new Promise((resolve, reject) => {
        request(url, (err, resp, body) =>{
            if(err){
                reject("Error: ", err)
            }else{
                //console.log("respuesta: ", resp)
                resolve(JSON.parse(resp.body))
            }
        })
    })
}

//Necesito poner validación por user_id a la hora de guardar results de productos
app.get('/itemsDB', (req, res) => {
    Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map( (u) =>{

                let firstURL = `https://api.mercadolibre.com/users/${u.user_id}/items/search?access_token=${u.access_token}&search_type=scan&limit=100`

                getCantidad(firstURL)
                    .then((r) => {
                        console.log(u.nombre)
                        let total = r.paging.total
                        let paging = r.scroll_id
                        let n = 1
                        let iteraciones
                        let resultados = r.results

                        if(total%100 !== 0 ){
                            iteraciones = Math.floor((total/100))+1
                        }else{
                            iteraciones = (total/100)-1
                        }

                        let promesas = []


                       let inter = interval(async () => {
                            let peticion
                            try {
                                peticion = await rp(`https://api.mercadolibre.com/users/${u.user_id}/items/search?access_token=${u.access_token}&scroll_id=${paging}&search_type=scan&limit=100`)
                            }catch (error){
                                res.send(error)
                            }
                            await console.log("EL LENGTH: ", promesas.length)
                            await promesas.push(peticion)
                        }, 300, {iterations: iteraciones})
                        .then(() => {
                            Promise.all(promesas)
                            .then( promesa => {
                                let arr = []
                                let items
                                let arregloRes = promesa.map( (p, index) => {
                                    let parce = JSON.parse(p);

                                    return parce['results'];
                                })

                                resultados.map((el) => {
                                    arr.unshift(el)
                                })

                                //console.log("Arreglores: ", arregloRes)
                                //SACAR LOS ELEMENTOS DEL ARREGLO
                                for(let j = 0; j<=arregloRes.length-1; j++){
                                    for(let k =0; k<=arregloRes[j].length-1; k++){
                                        arr.push(arregloRes[j][k]);
                                    }
                                }

                                items = new Items({
                                    seller_id: u.user_id,
                                    results: arr
                                })

                                Items.find({seller_id: u.user_id}, (err, itemDB) => {
                                    if(err){
                                        return res.status(400).json({
                                            ok: false,
                                            err
                                        })
                                    }
                                    console.log(itemDB.length)
                                    if(itemDB.length <= 0){
                                        console.log("ASI SI")
                                        items.save((err, itemsDB) => {
                                            if(err){
                                                return res.status(400).json({
                                                    ok: false,
                                                    err
                                                })
                                            }
                                            return itemsDB

                                        })
                                    }
                                    else{
                                        Items.findOneAndUpdate({seller_id: u.user_id}, {results: items.results}, (err, itemsDB) => {
                                            if(err){
                                                return res.status(400).json({
                                                    ok: false,
                                                    err
                                                })
                                            }

                                            return itemsDB

                                        })
                                    }

                                })


                                //res.json({"totalReal": total, "totalActual": arr.length, "results": arr})

                            })
                            .catch( err => {
                                console.log(err)
                            })
                        })
                    })
            })

            res.json({
                ok: true
            })
        }else{
            return
        }

    })
})

app.get('/ordersDB', (req, res) => {
    Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map( (u) =>{

                let firstURL = `https://api.mercadolibre.com/orders/search?seller=${u.user_id}&access_token=${u.access_token}&search_type=scan&limit=100`
                console.log(firstURL)
                getCantidad(firstURL)
                    .then((r) => {
                        console.log(u.nombre)
                        let total = r.paging.total
                        let paging = r.scroll_id
                        let n = 1
                        let iteraciones
                        let resultados = r.results

                        if(total%100 !== 0 ){
                            iteraciones = Math.floor((total/100))+1
                        }else{
                            iteraciones = (total/100)-1
                        }

                        let promesas = []


                       let inter = interval(async () => {
                            let peticion
                            try {
                                peticion = await rp(`https://api.mercadolibre.com/orders/search?seller=${u.user_id}&access_token=${u.access_token}&scroll_id=${paging}&search_type=scan&limit=100`)
                            }catch (error){
                                res.send(error)
                            }
                            await console.log("EL LENGTH: ", promesas.length)
                            await promesas.push(peticion)
                        }, 300, {iterations: iteraciones})
                        .then(() => {
                            Promise.all(promesas)
                            .then( promesa => {
                                let arr = []
                                let items
                                let arregloRes = promesa.map( (p, index) => {
                                    let parce = JSON.parse(p);

                                    return parce['results'];
                                })

                                resultados.map((el) => {
                                    arr.unshift(el)
                                })

                                //console.log("Arreglores: ", arregloRes)
                                //SACAR LOS ELEMENTOS DEL ARREGLO
                                for(let j = 0; j<=arregloRes.length-1; j++){
                                    for(let k =0; k<=arregloRes[j].length-1; k++){
                                        arr.push(arregloRes[j][k]);
                                    }
                                }

                                orders = new Ordenes({
                                    seller_id: u.user_id,
                                    results: arr
                                })

                                Ordenes.find({seller_id: u.user_id}, (err, orderDB) => {
                                    if(err){
                                        return res.status(400).json({
                                            ok: false,
                                            err
                                        })
                                    }
                                    console.log(orderDB.length)
                                    if(orderDB.length <= 0){
                                        console.log("ASI SI")
                                        orders.save((err, ordersDB) => {
                                            if(err){
                                                return res.status(400).json({
                                                    ok: false,
                                                    err
                                                })
                                            }
                                            return ordersDB

                                        })
                                    }
                                    else{
                                        Ordenes.findOneAndUpdate({seller_id: u.user_id}, {results: items.results}, (err, ordersDB) => {
                                            if(err){
                                                return res.status(400).json({
                                                    ok: false,
                                                    err
                                                })
                                            }

                                            return ordersDB

                                        })
                                    }

                                })


                                //res.json({"totalReal": total, "totalActual": arr.length, "results": arr})

                            })
                            .catch( err => {
                                console.log(err)
                            })
                        })
                    })
            })

            res.json({
                ok: true
            })
        }else{
            return
        }

    })
})

module.exports = app