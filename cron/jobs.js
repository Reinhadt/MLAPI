const {Usuario, Categoria, Ordenes} = require ('../models/users')
const request   = require('request');
const cron      = require('node-cron');
const mongoose  = require('mongoose')
const Drive     = require('../classes/transact');


console.log('Este es el cron que me devolvió la esperanza en vivir')
//'0 0 */3 * * *'
cron.schedule('0 0 */3 * * *', () =>{
    Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map( (u) =>{
                request.post(`https://api.mercadolibre.com/oauth/token?grant_type=refresh_token&client_id=${u.app_id}&client_secret=${u.secret}&refresh_token=${u.refresh_token}`, (err, response, body) => {
                    if(err){
                        throw err
                    }
                    console.log(JSON.parse(response.body))
                    let real = JSON.parse(response.body)

                    Usuario.findOneAndUpdate({user_id: u.user_id}, {access_token: real.access_token, refresh_token: real.refresh_token} , (err, usuarioDB)=>{
                        if(err){
                            console.log({
                                ok: false,
                                err
                            })
                        }
                        else{
                            console.log({
                                ok: true,
                                usuario: usuarioDB
                            })
                        }

                    })

                })
            })
        }else{
            return
        }

    })
})

cron.schedule('0 0 */23 * * *', () => {
    Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map( (u) =>{

                let firstURL = `https://api.mercadolibre.com/users/${u.user_id}/items/search?access_token=${u.access_token}&search_type=scan&limit=100`
                console.log(firstURL)
                getCantidad(firstURL)
                    .then((r) => {
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


                       let inter = interval(async ()=> {
                            let peticion
                            try {
                                peticion = await rp(`https://api.mercadolibre.com/users/${u.user_id}/items/search?access_token=${u.access_token}&scroll_id=${paging}&search_type=scan&limit=100`)
                            }catch (error){
                                console.log(error)
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
                                        return err
                                    }

                                    if(itemDB.length <= 0){
                                        console.log("ASI SI")
                                        items.save((err, itemsDB) => {
                                            if(err){
                                                return err
                                            }

                                            console.log('Guardado Correctamente')

                                        })
                                    }
                                    else{
                                        Items.findOneAndUpdate({seller_id: u.user_id}, {results: items.results}, (err, itemsDB) => {
                                            if(err){
                                                return err
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
        }else{
            return
        }

    })
})
cron.schedule('0 0 */23 * * *', () => {
/*     Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map( (u) =>{

                let firstURL = `https://api.mercadolibre.com/users/${u.user_id}/orders/search?access_token=${u.access_token}&search_type=scan&limit=100`

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
                                peticion = await rp(`https://api.mercadolibre.com/users/${u.user_id}/orders/search?access_token=${u.access_token}&scroll_id=${paging}&search_type=scan&limit=100`)
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

    }) */
})


cron.schedule('0 0 */23 * * *', () => {
    let url = `http://api.mercadolibre.com/sites/MLM/categories/all`
    Drive.getGzipped(url, (data) => {
        fs.writeFile('archivos/categorias.json', data, (err)=>{
            if(err) throw err
            res.json({
                ok: true
            })
        })
    })
})


cron.schedule('0 0 */23 * * *', () => {
    Usuario.find({}, (err, user) => {
        if(user.length > 0){
            user.map((u) => {
                rp(`${process.env.API_URL}/${u.nombre}/items`)
                .then((body) => {
                    let respuesta = JSON.parse(body)
                    let cantidad = respuesta.totalActual
                    rp(`${process.env.API_URL}/${u.nombre}/productos?limite=${cantidad}`)
                        .then((b) => {
                            let r = JSON.parse(b)
                            let a = Array.from(r.results)
                            let arr = a.map((el) => {
                                return el.category_id
                            }).filter((e, index, self) => {
                                return index == self.indexOf(e)
                            })

                            let categoria = new Categoria({
                                seller_id: u.user_id,
                                results: arr
                            })

                            Categoria.find({seller_id: u.user_id}, (err, catDB) => {
                                if(err){
                                    throw err
                                }

                                if(catDB.length <= 0){
                                    console.log("ASI SI")
                                    categoria.save((err, catsDB) => {
                                        if(err){
                                            throw err
                                        }

                                        return catsDB

                                    })
                                }
                                else{
                                    Categoria.findOneAndUpdate({seller_id: u.user_id}, {results: arr}, (err, catsDB) => {
                                        if(err){
                                            throw err
                                        }

                                        return catsDB
                                    })
                                }

                            })

                        })
                })
            })
        }

        return "true";

    })
})