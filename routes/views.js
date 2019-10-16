const express = require('express');
const router     = express.Router();
const Usuarios= require('../classes/userT');
const u       = new Usuarios()

router.get('/:marca', u.obtieneUsuario, (req, res) => {

    console.log(req.obtiene)
    if(req.obtiene !== null){
        res.render('welcome', {info: req.obtiene.friendly_name })
    }else{
        res.render('error')
    }

})

module.exports = router