//=====================
//BÁSICOS
//=====================
baseUrl = process.env.BASE_URL

//=====================
//ENTORNO
//=====================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//=====================
//BASES DE DATOS
//=====================
if(process.env.NODE_ENV === 'dev'){
    urlDB = 'mongodb://localhost:27017/cafe'
}else{
    urlDB = process.env.MONGO_URI
}

process.env.URLDB = urlDB