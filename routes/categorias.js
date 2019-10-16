const express = require('express');
const request = require('request');
const rp      = require ('request-promise')
const app     = express();
const config  = require('../config/config')
const misc    = require('../config/misc')
const fs      = require('fs')
const path    = require('path')
const zlib    = require('zlib')
const http    = require('http')
const Usuarios= require('../classes/userT');
const u       = new Usuarios()

const curl = new (require( 'curl-request' ))();
const {gzip, ungzip} = require('node-gzip');
const {Usuario, Categoria} = require('../models/users')

const pathArchivo = path.join(__dirname, '../archivos', 'categorias.json')

//temporales:
var mongoose = require('mongoose');
var Gridfs = require('gridfs-stream');
eval(`Gridfs.prototype.findOne = ${Gridfs.prototype.findOne.toString().replace('nextObject', 'next')}`);
function getGzipped(url, callback) {
    // buffer to store the streamed decompression
    var buffer = [];

    //encoding: null ayuda a que el request no mande un string, más bien un buffer
    //que luego zlib.gunzip puede descomprimir :)
    request(url, {encoding: null}, function(err, response, body){
        if(!err){
            if(response.headers['content-encoding'] == 'gzip'){
                //descomrimo el buffer (el archivo binario)
                zlib.gunzip(body, function(err, dezipped) {
                    if(err){
                        callback({ok: false})
                    }else{
                        callback(dezipped);
                    }
                });
            } else {
                callback(body);
            }
        }
        else{
            console.log(err)
        }
    });

}



app.get('/categorias', (req, res) => {

    let m = config[req.params.marca]

    console.log(`${process.env.BASE_URL}/sites/MLM/categories/all?withAttributes=true`)
    //console.log(usuarioDB[0])
    let url = `http://api.mercadolibre.com/sites/MLM/categories/all?withAttributes=false`

    getGzipped(url, (data) => {
            fs.writeFile('archivos/categorias.json', data, (err)=>{
                if(err) throw err
                res.json({
                    ok: true
                })
            })
    })

/*     request(`${process.env.BASE_URL}/sites/MLM/categories/all`, {encoding: null}, (err, resp, body) => {

        if(resp.headers['content-encoding'] == 'gzip'){
            zlib.gunzip(body, function(err, dezipped) {
              res.sendFile(dezipped.toString());
            });
          } else {
            callback(body);
          }


    }) */
})


app.get('/categoriasGuarda', (req, res) => {

    var db = mongoose.connection.db;
    var mongoDriver = mongoose.mongo;
    var gfs = new Gridfs(db, mongoDriver);

    var writestream = gfs.createWriteStream({
        filename: 'archivos/categorias.json',
        mode: 'w'
    });
    fs.createReadStream('archivos/categorias.json').pipe(writestream);
    //let readStream = fs.createReadStream('archivos/categorias.json')

    writestream.on('finish', () => {
        // This just pipes the read stream to the response object (which goes to the client)
        console.log('NOMBREARCHIVO:')
    });

    writestream.on('error', (err) => {
        res.end(err)
    })
})

app.get('/elchunk', (req,res) => {
    Chunks.find({"n": 1}, (err, itemDB) => {
        var db = mongoose.connection.db;
        var mongoDriver = mongoose.mongo;
        const gfs = new Gridfs(db, mongoDriver);
        let items = itemDB[0]
        let datos = items.data

        items.id?console.log("si hay data"):console.log("No hay nada")
        console.log(Object.keys(itemDB[0]))
        console.log(itemDB[0]._doc.data.buffer.toString('utf8'))
        let yeison = itemDB[0]._doc.data.buffer.toString('utf8')
        res.json({
            /* "results": JSON.parse(itemDB.data.toString()), */
            "resultados": yeison
        })
    })
})

app.get('/elfile', (req, res, next) => {

    fs.readFile('archivos/categorias.json', 'utf8', (err, data) => {
        if(err){
            throw err
        }else{
            let r = JSON.parse(data)
            //iterar en el json:
            let a = []
            let b = a.push(r)

            let arreglote = [r]

            Categoria.collection.remove({}, (err, removido) => {
                if(err){
                    throw err
                }else{


                    //var count = 0;
                    for(let propName in arreglote[0]){


                        Categoria.collection.insertOne(arreglote[0][propName], (err, resDB) => {
                            if(err){
                                throw err
                            }
                        })

                    }
                    res.json({
                        "OK": "True"
                    })
                }

            })




/*             Categoria.collection.insert(b[0], (err, resDB) => {
                if(err){
                    throw err
                }else{
                    res.json({
                        "OK": "TRUE"
                    })
                }
            }) */

            /* for(let i = 0; i<arreglote.length; i++){
                Categoria.collection.insert(arreglote[i], (err, resDB) => {
                    if(err){
                        throw err
                    }else{
                        res.json({
                            "OK": "TRUE"
                        })
                    }
                })
                break;
            } */

           /*  Categoria.collection.insert(left, (err, resDB) => {
                if(err){
                    throw err
                }else{
                    Categoria.collection.insert(right, (err, resDB) => {
                        if(err){
                            throw err
                        }else{
                            res.json({
                                "OK": "TRUE"
                            })
                        }
                    })
                }
            }) */

        }
    })
})

app.get('/categoriasNuevo', (req, res) => {

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
                                    return res.status(400).json({
                                        ok: false,
                                        err
                                    })
                                }

                                if(catDB.length <= 0){
                                    console.log("ASI SI")
                                    categoria.save((err, catsDB) => {
                                        if(err){
                                            return res.status(400).json({
                                                ok: false,
                                                err
                                            })
                                        }

                                        return catsDB

                                    })
                                }
                                else{
                                    Categoria.findOneAndUpdate({seller_id: u.user_id}, {results: arr}, (err, catsDB) => {
                                        if(err){
                                            return res.status(400).json({
                                                ok: false,
                                                err
                                            })
                                        }

                                        return catsDB
                                    })
                                }

                            })

                        })
                })
            })
        }
        res.json({
            ok: "true"
        })
    })


})


app.get('/:marca/categoriasGet', u.obtieneUsuario, (req, res) => {
    let m = req.obtiene

    Categoria.findOne({seller_id: m.user_id}, (err, usuarioDB) => {
        if(err){
            return res.status(400).json({
                ok: false,
                err
            })
        }else{
            if(usuarioDB != null){
                let lista = usuarioDB.results
                let arreglo = []
                for(let i = 0; i<lista.length; i++){
                    let pet = rp(`${process.env.BASE_URL}/categories/${lista[i]}`)
                    arreglo.push(pet)
                }

                Promise.all(arreglo)
                    .then((a) => {
                        //let as = JSON.parse(a)
                        let def = a.map((elemento) => {
                            return JSON.parse(elemento)
                        })
                        res.json({
                            "results": def
                        })
                    })
                    .catch(err => {
                        throw err
                    })
            }else{
                res.json({
                    "results": null
                })
            }
        }

    })
})

app.get('/categoriasfile', (req, res) => {
    res.sendFile(pathArchivo)
})

module.exports = app