const express = require('express')
const app = express()
// use when in prod
// const https = require("https");
// const fs = require("fs");

require("dotenv").config()

app.use(express.json())

app.use(require("./middleware/cors"));
app.use(require("./middleware/jwt"));

app.use(require("./router/users"))
app.use(require("./router/meals"))
app.use(require("./router/entries"))
app.use(require("./router/reports"))
app.use(require("./router/invites"))

const port = process.env.PORT || 8080;
app.listen(port, ()=>{
  console.log(`http Example app listening on port ${port}`)
})

// for calling the AUTH0 management api - we need SSL
// const httpOptions = {
//   key: fs.readFileSync("./private.pem"),
//   cert: fs.readFileSync("./publiccert.pem")
// };

// const server = https.createServer(httpOptions, app).listen(port, ()=>{
//   console.log(`https Example app listening on port ${port}`)
// })