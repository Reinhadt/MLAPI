const request = require('request');
const rp      = require('request-promise')


function userDataGetter ( usrID ) {

    return rp(`https://api.mercadolibre.com/users/${usrID}`)
        .then((datos)=> {
            let d = JSON.parse(datos)
            console.log("DATOS USUARIOS: ", d.nickname)
            return d
        })
        .catch(err => {
            console.log("ERROR USUARIO: ", err)
            throw err
        })

}

module.exports = {
    userDataGetter
}