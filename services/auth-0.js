var axios = require("axios").default;
var request = require("request");
const jwt_decode = require("jwt-decode");
const NodeCache = require( "node-cache" );

const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );


async function retrieveManagementApiAccessToken(){
    return new Promise((res, rej)=>{
        var options = { method: 'POST',
            url: process.env.AUTH0_MNGMNT_URL,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              "client_id": process.env.AUTH0_MNGMNT_CLIENT_ID,
              "client_secret":process.env.AUTH0_MNGMNT_CLIENT_SECRET,
              "audience": process.env.AUTH0_MNGMNT_AUDIENCE,
              "grant_type":"client_credentials"
            })
        };

        request(options, function (error, response, body) {
            if (error) {rej(error)}
            else {res(JSON.parse(body).access_token)}
        });
    })

        
}

module.exports.retrieveManagementApiAccessToken = retrieveManagementApiAccessToken;


function checkIsExpired(token){
    var decoded = jwt_decode(token);

    // check for an expiration date
    let now = Date.now() / 1000;
    let minutes = 2;
    let inMinutes = (Date.now() + minutes*60000) / 1000;

    if (decoded.exp < inMinutes) {
        return true
    }
    return false;
}

module.exports.checkIsExpired = checkIsExpired;

async function getAccessToken(){
    
    const TOKEN_CACHE_KEY = 'mgmntToken';
    
    let existingToken = await myCache.get(TOKEN_CACHE_KEY);
    let isValid = existingToken && !checkIsExpired(existingToken)
    
    if(existingToken && isValid){
        console.log("RETURNING EXISTING")
        return existingToken;
    }

    let token = await retrieveManagementApiAccessToken();
    let success = await myCache.set(TOKEN_CACHE_KEY, token, 10000 );
    console.log("SAVED TOKEN")
    return await myCache.get(TOKEN_CACHE_KEY);;
}

module.exports.getMgmntAccessToken = getAccessToken;



const magicLink = async (name, email)=>{

    let token = await getAccessToken()

    var options = {
      method: 'POST',
      url: `${process.env.AUTH0_MNGMNT_URL}/passwordless/start`,
      headers: {
        'content-type': 'application/json',
        "authorization": `Bearer ${token}`
  
      },
      data: {
        client_id: process.env.AUTH0_MNGMNT_CLIENT_ID,
        client_secret: process.env.AUTH0_MNGMNT_CLIENT_SECRET,
        connection: 'email',
        email: email,
        send: 'link'
      }
    };
  
    axios.request(options).then(function (response) {
    }).catch(function (error) {
    });
  }

module.exports.magicLink = magicLink;

module.exports.getUsers = async function getUsers(){
  let token = await getAccessToken();

    let response = await axios.get(`${process.env.AUTH0_MNGMNT_URL}/api/v2/users?include_totals=true`, {
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "authorization": `Bearer ${token}`
    }
    })
    response.data.data = response.data.users;
    return response.data;
} 