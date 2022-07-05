import express from "express"
import homeController from "../controller/homeController"

const Router = express.Router()
const initWebRoute = app => {
    //home page
    Router.get("/", homeController.getHomePage)

    //update data sensor
    Router.get("/update", homeController.getData)

    //return station aqi mới nhất theo địa chỉ MAC
    Router.get("/aqi/:mac", homeController.getAQI)

    //router test de? tinh p25 va p10
    Router.get("/chart/:val/:mac", homeController.getDataChart)

    //router trả về dữ liệu mới nhất theo địa chỉ MAC
    Router.get("/get/:mac", homeController.getNewData)

    //router trả về danh sách các trạm mới nhất
    Router.get("/stations", homeController.getStations)

    //thử nhận data bằng POST Method
    Router.post("/test",homeController.testpost)

    //trang thông tin: định nghĩa AQI, cách tính
    Router.get("/info",homeController.getInfoPage)




    return app.use("/", Router)
}

export default initWebRoute