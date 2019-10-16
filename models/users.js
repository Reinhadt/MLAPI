const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let Schema = mongoose.Schema

let usuariosSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    friendly_name: {
        type: String,
        require: [true, 'El nombre es un campo necesario']
    },
    secret: {
        type: String,
        required: [true, 'El secret id es necesario']
    },
    app_id: {
        type: String,
        required: [true, 'El app id es necesario']
    },
    access_token: {
        type: String,
        required: [true, 'El access token es necesario']
    },
    token_type: {
        type: String,
        required: [true, 'El type es necesario']
    },
    user_id: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    refresh_token: {
        type: String,
        required: [true, 'El refresh es necesario']
    },
})


let itemsSchema = new Schema({
    seller_id: {
        type: String,
        unique: true,
        required: [true, 'El seller_id es necesario']
    },
    results: {
        type: Array,
        required: [true, 'No pueden estar vacíos los resultados']
    }
})

let categoriasSchema = new Schema({
    seller_id: {
        type: String,
        unique: true,
        required: [true, 'El seller_id es necesario']
    },
    results: {
        type: Array,
        required: [true, 'No pueden estar vacíos los resultados']
    }
})

let ordersSchema = new Schema({
    seller_id: {
        type: String,
        unique: true,
        required: [true, 'El seller_id es necesario']
    },
    results: {
        type: Array,
        required: [true, 'No pueden estar vacíos los resultados']
    }
})

let chunksSchema = new Schema({})

usuariosSchema.plugin(uniqueValidator, {message: '{PATH} debe de ser único'})

let Usuario =  mongoose.model('Usuario', usuariosSchema, 'usuarios')
let Items   =  mongoose.model('Items', itemsSchema, 'items')
let Chunks  =  mongoose.model('Chunks', chunksSchema, 'fs.chunks')
let Categoria  =  mongoose.model('Categoria', categoriasSchema, 'categorias')
let Ordenes  =  mongoose.model('Ordenes', ordersSchema, 'ordenes')

module.exports = {
    Usuario: Usuario,
    Items  : Items,
    Chunks : Chunks,
    Categoria: Categoria,
    Ordenes: Ordenes
}