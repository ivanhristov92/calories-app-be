const express = require("express");
const router = express.Router()
const MealsController = require("../controllers/meals")


router.get('/meals', async (req, res) => {
    try {
        let result = await MealsController.find(req.query);
        res.send(JSON.stringify(result))
    } catch(e){
        console.log(e)
        res.send(500, JSON.stringify(e))
    }
   
})
router.post('/meals', async (req, res) => {
    try {
        let result = await MealsController.create(req.body);
        res.status(201).send(JSON.stringify(result))
    } catch(e){
        console.log(e)
        res.send(500, JSON.stringify(e))
    }
   
})


router.get('/meals/:id', async (req, res) => {
    try {
        let result = await MealsController.get();
        res.send(JSON.stringify(result)) 
     } catch(e){
        res.send(500, JSON.stringify(e)) 
     }
})


router.put('/meals/:id', async (req, res) => {
    console.log("meals")
    try {
        let result = await MealsController.update(req.params.id, req.body);
        res.status(200).send(JSON.stringify(result)) 
     } catch(e){
         console.log(e)
        res.status(500).send(JSON.stringify(e)) 
     }
})

module.exports = router;