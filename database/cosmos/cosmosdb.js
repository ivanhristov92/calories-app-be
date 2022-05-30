const CosmosClient = require('@azure/cosmos').CosmosClient


const config = {
  host: process.env.COSMOSDB_HOST,
  auth: process.env.COSMOSDB_AUTH,
  database: process.env.COSMOSDB_DATABASE,
  userAgentSuffix: process.env.COSMOSDB_USER_AGENT_SUFFIX
}

module.exports = {
  config,
  
  CosmosDB: class CosmosDB  {

    constructor (host, auth, database, userAgentSuffix) {
      if (!host || !auth || !database) throw new Error('Missing database configuration details');

      this.database = database;
      
      this.client = new CosmosClient({
        endpoint: host,
        key: auth,
        userAgentSuffix: userAgentSuffix
      })

      this.omit = ["_attachments", "_etag", "_rid", "_self", "_ts"]
    }

    async _createDatabase(databaseId){
      try {
        await this.client.databases.createIfNotExists({
          id: databaseId
        });
      } catch(e){}
     
    }

    async _cleanup(resource){
      try {
        await this.client.database(this.database).container(resource).delete();
      } catch(e){
        console.log(e.code)
        // does not exist potentially
        if(e.code !== 404){
          throw e;
        }
      }
      await this.client.database(this.database).containers.createIfNotExists(
        { id: resource }
      )
    }
    
    _adapt(result){
      result.created = new Date(result.created);
      result.lastModified = new Date(result.lastModified);
      this.omit.forEach(key=>{
        delete result[key];
      })
      return result;
    }

    async _create (resource, data) {
      if(Array.isArray(data)){
        return await this._createMany(resource, data)
      }
      let result;
      try {
          data.created = new Date();
          data.lastModified = new Date();

          const res = await this.client
          .database(this.database)
          .container(resource)
          .items.create(data)

          result = res.resource;
          result = this._adapt(result)
      } catch (error) {
        console.log(error)
        result = false;
      }
      if (!result) throw Error('Error creating record');
      return result;
    }

    async _createMany(resource, data){
      let result;
      try {
        let operations = data.map(d=>{
          d.created = new Date();
          d.lastModified = new Date();
          return {
            operationType: "Create",
            resourceBody: d,
        }
        })

        const res = await this.client
        .database(this.database)
        .container(resource)
        .items.bulk(operations)

        let items = res.map(r=>this._adapt(r.resourceBody))
        result = items;

      } catch (error) {
        result = false;
      }
      if (!result) throw Error('Error creating many records');
      return result;
    }

    async _get(resource, id) {

      if (!id) throw 'No ID provided';
      let result;
      try {
        const querySpec = {
          query: 'SELECT * FROM root where id=@id',
          parameters: [{
            name: "@id",
            value: id
          }]
          
        }
      
        const res = await this.client
          .database(this.database)
          .container(resource)
          .items.query(querySpec)
          .fetchAll()
        

          let results = res.resources;

          if(results[0]){
            result = this._adapt(results[0]);
          }

      } catch (error) {
        result = false;
      }
      if (!result) throw 'Error retrieving information';
      return result;
    }

    async _update (resource, id, data) {
      let result;
      try {
        data.id = id;
        data.lastModified = new Date();

        let existing = await this._find(resource, {id});
        existing = existing.data[0]

        const res = await this.client
        .database(this.database)
        .container(resource)
        .item(id)
        .replace({...existing, ...data})

        result = this._adapt(res.resource);

      } catch (error) {
        console.log(error)
        result = false;
      }
      if (!result) throw 'Error getting information for update';
      return result;
    }

    async _updateMany(resource, data){

      let result;
      try {

        let getExisting = data.map(d=>({
          operationType: "Read",
          id: d.id
        }))
        const existingResponses = await this.client
        .database(this.database)
        .container(resource)
        .items.bulk(getExisting)

        let existingItems = existingResponses.map(r=>this._adapt(r.resourceBody))
        let preparedUpdates = existingItems.map((d, i)=>({...d, ...data[i], lastModified: new Date()}))

        let updateOperations = preparedUpdates.map(u=>{
          return {
            operationType: "Replace",
            resourceBody: u,
            id: u.id
          }
        })
        
        const updatingResponses = await this.client
        .database(this.database)
        .container(resource)
        .items.bulk(updateOperations)

        result = updatingResponses.map(d=>this._adapt(d.resourceBody))

        } catch (error) {
          result = false;
        }
        if (!result) throw Error('Error updating many records');
        return result;
    }

    async _find (resource, filter = {}, limit = 1000, offset = 0, sort = 'id:desc', fields) {
      let whereClause = ``;
      let params = [];

      if(filter.hasOwnProperty("limit")){
        limit = filter.limit;
      }
      delete filter.limit;
      if(filter.hasOwnProperty("offset")){
        offset = filter.offset;
      }
      delete filter.offset;

      if(filter.hasOwnProperty("sort")){
        sort = filter.sort;
      }
      delete filter.sort;

      Object.keys(filter).filter(a=>a).forEach((key, i)=>{
        
        if(whereClause.length === 0){
          whereClause += ` WHERE `
        };
        if(i > 0){
          whereClause += `
            and
          `
        }
        console.log(filter)
        let gt = filter[key].substring(0, 2) === "*>";
        let lt = filter[key].substring(0, 2) === "*<";
        let between = filter[key].substring(0, 2) === "*|";

        if(gt || lt){
          filter[key] = filter[key].substring(2, filter[key].length)
          whereClause += `
          r.${key}${gt?">":(lt?"<": "=")}@${key}
        `
        } else if(between){
          let dates = filter[key].split("|");
          whereClause += `
          r.${key}>@gt${key}
        `
          params.push({name: "@gt" + key, value: dates[1]})
            
          whereClause += `
            and
            r.${key}<@lt${key}
          `
          params.push({name: "@lt" + key, value: dates[2]})
        } else {
          whereClause += `
          r.${key}=@${key}
        `
        params.push({name: "@" + key, value: filter[key]})
        }
      
      })
      let _sort_data = sort.split(':');
      let orderByClause = `
        ORDER BY r.${_sort_data[0]} ${_sort_data[1]} 
      `
      let limitClause = `
        OFFSET ${offset} LIMIT ${limit}
      `

      let query = `SELECT * from root r ${whereClause}  ${orderByClause} ${limitClause}`
      console.log(query)
      let countQuery = `SELECT value count(1) from root r ${whereClause} ${orderByClause}`
      let result;
      try {
          const { resources: results } = await this.client
        .database(this.database)
        .container(resource)
        .items.query({
          query: query,
          parameters: params
        })
        .fetchAll()

        
        let total = await this.client
        .database(this.database)
        .container(resource)
        .items.query({query: countQuery, parameters: params})
        .fetchAll() 

        total = total.resources[0];
        let data = results.map(res=>{
          return this._adapt(res);
        })

        let hasMore = (total - (offset+1)*limit) > 0

        result = {
          data,
          total,
          hasMore
        }

      } catch (error) {
        throw Error(error);
      }

      if (!result) return { total: 0, data: []}
      return result;
    }   

  

    async _delete (resource, id) {
      // return this._find(resource, {id})
      let result
      console.log(resource, id)
      try {
        result =   await this.client
        .database(this.database)
        .container(resource)
        .item(id, id)
        .delete();

        // const { resource } = await container.item(id, category).delete();
        // result = resource;
      } catch (error) {
        result = false;
      }
    
      if (!result) throw Error('Error deleting record');
      return true;
    }

    async _deleteMany(resource, query){
    
      let result;
      let params = [];
      let whereClause = ""
      Object.keys(query).forEach((key, i)=>{
        if(whereClause.length === 0){
          whereClause += ` WHERE `
        };
        if(i > 0){
          whereClause += `
            and
          `
        }
        whereClause += `
          r.${key}=@${key}
        `
        params.push({name: "@" + key, value: query[key]})
      })

      let _query = `SELECT * from root r ${whereClause}`

      try {
        const { resources: results } = await this.client
        .database(this.database)
        .container(resource)
        .items.query({
          query: _query,
          parameters: params
        })
        .fetchAll()

        let operations = results.map(d=>({
            operationType: "Delete",
            id: d.id
        }))

        const res = await this.client
        .database(this.database)
        .container(resource)
        .items.bulk(operations)

        let items = res.map(r=>r.statusCode === 204)
        result = items;

        } catch (error) {
          result = false;
        }
        if (!result) throw Error('Error deleting many records');
        return result;
    }


    // transactional properties exist in
    // - stored procedures
    // - ...container(resource).items.bulk(operations) - but cannot be chained

    async runTransaction (funcs) {

      let chain;

      funcs.forEach((func, i)=>{
        if(i === 0){
          chain = func()
        }else {
          chain = chain.then(func)
        }
      })
      let res = await chain.then(()=>true).catch(err=>({message: "Error in transaction", err}))
      return res;
    }
    

    async _createStoredProcedure(resource, id, fn){
      return await this.client.database(this.database).container(resource).scripts.storedProcedures.create({id, body:fn})
    }
  
    async callStoredProcedure(resource, storedProcedureId, paramsArr = []) {
      let result;
      try {
        let fn = await this.client.database(this.database).container(resource).scripts.storedProcedure(storedProcedureId)
        result = await fn.execute(undefined, paramsArr);
      } catch(err){
        throw Error('Error calling procedure');
      }
      if (!result) throw Error('Error calling procedure');
      return result;
    }

  },


 
 
}