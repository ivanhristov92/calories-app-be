const {getDB} = require("../database/getDb")
const {getUsers} = require("../services/auth-0")

async function find(){
    return getUsers();
}

function create(data){
    return getDB()._create("Users", data)
}

function update(id, data){
    return getDB()._update("Users", id, data)
}


module.exports = {
    find, create, update
}