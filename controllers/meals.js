const Joi = require("joi")
const uuidv1 = require('uuid/v1');
const {getDB} = require("../database/getDb")

let schema = Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    maxEntries: Joi.number().required(),
    icon: Joi.string()
}).required()

function find(query){
    return getDB()._find("Meals", {})
}

function update(id, data){
    return getDB()._update("Meals", id, data)
}

async function create(data){
    data.id = uuidv1();

    let {error} = schema.validate(data);
    if(error) throw error;

    return await getDB()._create("Meals", data);
}

module.exports = {
    find, update, create
}