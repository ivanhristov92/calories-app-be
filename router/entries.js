const express = require("express");
const router = express.Router()
var guard = require("express-jwt-permissions")();
const EntriesController = require("../controllers/entries")


router.get('/entries', async (req, res) => {
    try {
       let result = await EntriesController.find(req.query);
       res.status(200).send(JSON.stringify(result)) 
    } catch(e){
        console.log(e)
       res.send(500, JSON.stringify(e)) 
    }
})


router.post('/entries', async (req, res) => {
   try {
       let result = await EntriesController.create(req.body);
       if(typeof result === "string" && result.match(/reached/)){
           res.status(400).send({msg: "Meal limit reached"});
       } else {
           res.status(201).send(JSON.stringify(result)) 
       }
    } catch(e){
        console.log(e)
       res.status(500).send(JSON.stringify(e)) 
    }
})

router.get('/entries/:id', async (req, res) => {
   try {
       let result = await EntriesController.get();
       res.status(200).send(JSON.stringify(result)) 
    } catch(e){
       res.status(500).send(JSON.stringify(e)) 
    }
})

router.put('/entries/:id', async (req, res) => {
   try {
       let result = await EntriesController.update(req.params.id, req.body);
       res.status(200).send(JSON.stringify(result)) 
    } catch(e){
        console.log(e)
       res.status(500).send(500, JSON.stringify(e)) 
    }
})

router.delete('/entries/:id', async (req, res) => {
   try {
       let result = await EntriesController.delete(req.params.id);
       res.status(200).send(JSON.stringify(result)) 
    } catch(e){
       res.status(500).send(JSON.stringify(e)) 
    }
})

module.exports = router;