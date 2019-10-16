const {Usuario} = require('../models/users')

class UserT{

    constructor(){
    }

    async obtieneUsuario(req, res, next){
        console.log("DESDE USERT: ", req.params.marca)
        let n = req.params.marca
        await Usuario.findOne({nombre: n}, (err, usuarioDB) => {
            if(err){
                return err
            }else{
                console.log("Usuario de db: ", usuarioDB)
                req.obtiene = usuarioDB
                next()
            }
        })
    }

    agregarUserT(opt){
        this.user = opt
        console.log("usuario :", this.user)

        return this.user
    }
}

module.exports = UserT