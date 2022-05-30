const Joi = require("joi")
const uuidv1 = require('uuid/v1');

const {getDB} = require("../database/getDb")
const {format, subDays} = require("date-fns")


let schema = Joi.object({
    id: Joi.string().required(),
    food: Joi.string().required(),
    calories: Joi.number().required(),
    meal: Joi.string(),
    userId: Joi.string().required(),
    isoDate: Joi.string().required(),
    time: Joi.string().required()
}).required()


function formatDateRange(date1, date2){
    return `*|${format(date1, "yyyy-MM-dd")}|${format(date2, "yyyy-MM-dd")}|*`
}

async function find(data){
    let entries =  await getDB()._find("Entries", data, 10000, 0, "lastModified:asc");
    return entries;
}

function update(id, data){
    return getDB()._update("Entries", id, data);
}
function _delete(id){
    return getDB()._delete("Entries", id);
}

async function create(data){
    data.id = uuidv1();
    
    let validation = schema.validate(data)
    if(validation.error) throw validation.error;

    if(data.meal){
        let meal = await getDB()._find("Meals", {id: data.meal});
        meal = meal.data[0]
        if(!meal){
            throw "Invalid meal id provided"
        }
        let limit = meal.maxEntries;
        
    
        let date = new Date();

        let entriesForThisMeal = await getDB()._find("Entries", {
            meal: meal.id,
            isoDate: formatDateRange(new Date(date.toISOString()), subDays(new Date(date.toISOString()), -1)), 
            userId: data.userId
        })
         if(entriesForThisMeal.total >= Number(limit)){
            return "Limit reached"
         };
    }
    
    return await getDB()._create("Entries", data);
}

module.exports = {
    find,
    get,
    update,
    delete: _delete,
    create
}