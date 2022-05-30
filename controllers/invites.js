const Joi = require("joi")
const uuidv1 = require('uuid/v1');
const {magicLink} = require("../services/auth-0")

let schema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } })
}).required();


async function create(data){
    data.id = uuidv1();

    let {error} = schema.validate(data);
    if(error) throw error;

    return await magicLink(data.name, data.email)
}

module.exports = {
    create
}