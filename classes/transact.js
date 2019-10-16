require('../config/misc')

const request = require('request')
const rp      = require ('request-promise')
const interval= require('interval-promise')

class MlDriver {

    constructor(opt){
        this.opt = opt
    }

    getUrl(end, p=0){
        console.log(this.opt)
        let url
        if(end === "ordersAsc"){
            url = `${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&offset=${p}&sort=date_asc&access_token=${this.opt.access_token}`
            console.log(url)
        }
        if(end === "orders"){
            url = `${process.env.BASE_URL}/${end}/search?seller=${this.opt.user_id}&offset=${p}&sort=date_desc&access_token=${this.opt.access_token}`
            console.log(url)
        }
        if(end === "ordersScroll"){
            url = `${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&access_token=${this.opt.access_token}&search_type=scan`
            console.log(url)
        }
        if(end === "items"){
            console.log("Offset: " , p)
            url = `${process.env.BASE_URL}/users/${this.opt.user_id}/${end}/search?access_token=${this.opt.access_token}&offset=${p}&search_type=scan`
        }

        return url
    }


    getGzipped(url, callback) {
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


    getCantidad(end){
        //poner validación para ver qué tipo de endpoint es y arreglar la url en consecuencia
        return new Promise((resolve, reject) => {
            request(this.getUrl(end), (err, resp, body) =>{
                if(err){
                    reject("Error: ", err)
                }else{
                    //console.log("respuesta: ", resp)
                    resolve(JSON.parse(resp.body))
                }
            })
        })
    }

    getData(endpoint, limite, pagina){

        return new Promise((resolve, reject) => {
            this.getCantidad(endpoint)
                .then((r) =>{
                    let total = r.paging.total
                    console.log("Total: ", r.paging.total)
                    let iteraciones, pInicial

                    if(pagina !== null || limite !== null){
                        iteraciones = Number(limite/50)

                        pInicial = Number((pagina * iteraciones)*50)

                    }else{
                        pInicial = 0
                        if(total%50 === 0){
                            iteraciones = total/50
                        }else if(total%50 !== 0){
                            iteraciones = (total/50)+1
                        }
                    }

                    let promesas = []

                    for(let i = 0; i<iteraciones; i++){
                        console.log("ies: ",  i)
                        //let peticion = rp(`${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&access_token=${this.opt.access_token}`)
                        let peticion;
                        if(endpoint === "ordersAsc"){
                            console.log(endpoint)
                            peticion = rp(`${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&offset=${pInicial}&sort=date_asc&access_token=${this.opt.access_token}`)
                        }else{
                            peticion = rp(`${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&offset=${pInicial}&sort=date_desc&access_token=${this.opt.access_token}`)
                        }

                        promesas.push(peticion)
                        pInicial = Number(pInicial + 50)
                    }

                    Promise.all(promesas)
                    .then( promesa => {
                        let arr = [];
                        let arregloRes = promesa.map( (p, index) => {
                            let parce = JSON.parse(p);

                            return parce['results'];
                        })

                        //console.log("Arreglores: ", arregloRes)
                        //SACAR LOS ELEMENTOS DEL ARREGLO
                        for(let j = 0; j<=arregloRes.length-1; j++){
                            for(let k =0; k<=arregloRes[j].length-1; k++){
                                arr.push(arregloRes[j][k]);
                            }
                        }

                        resolve({"totalReal": total, "totalActual": arr.length, "results": arr})

                    })
                    .catch( err => {
                        console.log(err)
                    })

                })
                .catch(err => {
                    console.log("elerror: ", err)
                })
        })

    }

    getDataScroll(endpoint, limite, pagina){
        console.log('EL END: ', endpoint)
        return new Promise((resolve, reject) => {
            this.getCantidad(endpoint)
                .then((r) =>{
                    console.log("Respuesta GetCantidad: ", r)
                    let total = r.paging.total
                    let SID = r.paging.scroll_id
                    console.log("scrollid: ", SID)
                    let iteraciones, pInicial, vueltas
                    let skipPagina = 2;

                    if(pagina == null || limite == null){
                        pagina = 3;
                        limite = 5000;
                    }
                    else{
                        pagina = Number(pagina) + Number(skipPagina)
                    }

                    iteraciones = Number(Math.floor(limite/50))
                    vueltas = Number((pagina * iteraciones))

                    let promesas = [];
                    let contador = 0;
                    //let skip = Number(vueltas - iteraciones);
                    let skip = 10000;

                    console.log('SKIP: ', skip);
                    console.log('Iteraciones: ', vueltas)
                    let inter = interval(async () => {
                        let peticion
                        contador ++;

                        try {
                            peticion = await rp(`${process.env.BASE_URL}/orders/search?seller=${this.opt.user_id}&access_token=${this.opt.access_token}&scroll_id=${SID}&search_type=scan`)
                        }catch (error){
                            throw error
                        }

                        if( (contador*limite) >= skip ){
                            await promesas.push(peticion)
                        }
                        await console.log("EL LENGTH: ", promesas.length)
                        //await promesas.push(peticion)
                        //promesas.push(peticion)
                        console.log("Contador: ", contador);
                    }, 0, {iterations: Number(vueltas)})
                    .then(() => {
                        Promise.all(promesas)
                        .then( promesa => {
                            let arr = [];
                            let arregloRes = promesa.map( (p, index) => {
                                console.log('INDICE: ', index)
                                let parce = JSON.parse(p);

                                return parce['results'];
                            })

                            //console.log("Arreglores: ", arregloRes)
                            //SACAR LOS ELEMENTOS DEL ARREGLO
                            for(let j = 0; j<=arregloRes.length-1; j++){
                                for(let k =0; k<=arregloRes[j].length-1; k++){
                                    arr.push(arregloRes[j][k]);
                                }
                            }

                            resolve({"totalReal": total, "totalActual": arr.length, "results": arr})

                        })
                        .catch( err => {
                            console.log(err)
                        })
                    })

                })
                .catch(err => {
                    console.log("elerror: ", err)
                })
        })

    }

}

module.exports = MlDriver