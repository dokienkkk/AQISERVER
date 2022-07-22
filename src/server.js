import express from "express"
import dotenv from "dotenv"
import viewEngineConfigc from "./configc/viewEngine"
import initWebRoute from "./router/web"
import initWebRouteAdmin from "./router/admin"
import formatDate from "./utils/date"
import pool from "./configc/connectDB"
dotenv.config()
const app = express()

//parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))

// parse application/json
app.use(express.json())

viewEngineConfigc(app)
initWebRoute(app)
initWebRouteAdmin(app)

//MQTT Subscribe
const mqtt = require('mqtt')
const topic = 'dckaqi'
const client = mqtt.connect('mqtt://broker.hivemq.com:1883')
// const client = mqtt.connect('mqtt://broker.mqttdashboard.com')


client.on("connect", () => {
    // console.log("connected to MQTT Broker")
})



// Subscribe to a topic with QoS 0
client.on('message', async function (topic, payload, packet) {
    // Payload is Buffer
    // console.log(`Topic: ${topic}, Message: ${payload.toString()}, QoS: ${packet.qos}`)
    // console.log(typeof payload.toString())
    // console.log(`Topic: ${topic}`)
    //console.log(payload.toString())
    //data.push(payload.toString())
    let data = JSON.parse(payload.toString())
    const date = new Date()
    const time = formatDate(date)
    await pool.execute(`INSERT INTO data (mac,temp,humi,co,p25,p10) VALUES ('${data.mac}','${data.temp}','${data.humi}','${data.co}','${data.p25}','${data.p10}')`)
    //console.log(data + " " +  time)
    console.log(data.mac)
})


// app.get("/kien", (req,res) => {
//     res.send("test")
//     data = []
// })

client.on("connect", () => {
    client.subscribe(topic)
})



app.listen(process.env.PORT, () => {
    console.log(`Server run at port ${process.env.PORT}`)
})