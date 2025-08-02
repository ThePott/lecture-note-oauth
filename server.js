const express = require("express")
const cors = require("cors")
const axios = require("axios")

const app = express()
app.use(express.json())

const corsOptions = {
    origin: ["http://localhost:5500", "127.0.0.1:5500",],
    methods: ["OPTIONS", "POST", "DELETE"],
}
app.use(cors(corsOptions))

app.listen(3000, () => console.log("server is on port 3000"))
