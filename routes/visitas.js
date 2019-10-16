const express  = require('express');
const router   = express.Router();
const request  = require('request');
const Usuarios = require('../classes/userT');
const u        = new Usuarios()

router.get('/:marca', u.obtieneUsuario, (req, res) => {
    res.json({
        ok: true,
        marca: req.params.marca,
        obtiene: req.obtiene.user_id
    })
})

module.exports = router;