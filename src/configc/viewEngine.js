import express from "express"
import session from "express-session"
import cors from "cors"

const viewEngineConfigc = (app) => {
    app.set('view engine', 'ejs')
    app.set('views', './src/views')
    app.use(express.static('./src/public'))

    //cors
    app.use(cors())

    //session
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false
    }))
}

export default viewEngineConfigc