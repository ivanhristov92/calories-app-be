const {CosmosDB, config} = require("./cosmos/cosmosdb")
const db = new CosmosDB(config.host, config.auth, config.database)

module.exports.getDB = function getDB(){
    return db;
}