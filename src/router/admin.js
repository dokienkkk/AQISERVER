import express from "express"
import adminController from "../controller/adminController"

const Router = express.Router()
const initWebRouteAdmin = app => {
    

    Router.get("/login",adminController.getLoginPage)

    // api lấy trạng thái hoạt động của điểm đo
    Router.get("/status/:mac", adminController.getStatus)

    //vô trang admin quản lý
    Router.get("/home", adminController.getAdminHomePage)

    //admin map
    Router.get("/map", adminController.getAdminMapPage)

    //admin stats
    Router.get("/stats", adminController.getAdminStatsPage)



    return app.use("/admin", Router)
}

export default initWebRouteAdmin