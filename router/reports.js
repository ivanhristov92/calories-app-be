const express = require("express");
const router = express.Router()
var guard = require("express-jwt-permissions")();

const ReportsController = require("../controllers/reports")

router.post('/reports/:id', async (req, res) => {
    try {
        let result = await ReportsController.run(req.params.id);
        res.status(result.exists ? 204 : 201).send(JSON.stringify(result)) 
     } catch(e){
         console.log(e)
        res.status(500).send(JSON.stringify(e)) 
     }
})


module.exports = router;