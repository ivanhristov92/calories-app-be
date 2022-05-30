const express = require("express");
const router = express.Router()
const UsersController = require("../controllers/users")



router.get('/users', async (req, res) => {
    console.log("getting", req.session)
    try {
        let result = await UsersController.find(req.query);
        
        res.send(JSON.stringify(result)) 
     } catch(e){
         console.log(e)
        res.send(500, JSON.stringify(e)) 
     }
})



router.post('/users', async (req, res) => {
    try {
        let result = await UsersController.create(req.body);
        res.status(201).send(JSON.stringify(result)) 
     } catch(e){
         console.log(e)
        res.send(500, JSON.stringify(e)) 
     }
  })

  router.put('/users/:id', async (req, res) => {
    try {
        let result = await UsersController.update(req.params.id, req.body);
        res.status(201).send(JSON.stringify(result)) 
     } catch(e){
         console.log(e)
        res.send(500, JSON.stringify(e)) 
     }
  })


  router.get('/users/me', async (req, res) => {
    try {
        res.send(JSON.stringify(req.currentUser)) 
     } catch(e){
         console.log(e)
        res.send(500, JSON.stringify(e)) 
     }
})

  module.exports = router;