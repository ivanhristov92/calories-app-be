const express = require("express");
const router = express.Router()
var guard = require("express-jwt-permissions")();

const InvitesController = require("../controllers/invites")

app.post('/invites', async (req, res) => {
    try {
        let result = await InvitesController.create(req.body);
        res.status(201).send(JSON.stringify(result)) 
     } catch(e){
       console.log(e)
        res.status(500).send(JSON.stringify(e)) 
     }
})


module.exports = router;