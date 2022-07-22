import express from "express"
import homeController from "../controller/homeController"
import authController from "../controller/authController"

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

    //router trả về dữ liệu AQI mới nhất theo địa chỉ MAC
    Router.get("/get/:mac", homeController.getNewData)

    //router trả về dữ liệu AQI của giờ trong ngày được chọn
    Router.get("/get/:mac/:date", homeController.getAQIperDate)

    //router trả về danh sách các trạm mới nhất
    Router.get("/stations", homeController.getStations)

    //thử nhận data bằng POST Method
    Router.post("/test", homeController.testpost)

    //trang thông tin: định nghĩa AQI, cách tính
    Router.get("/info", homeController.getInfoPage)

    Router.post("/dck", homeController.dck)


    //xử lý đăng nhập
    Router.post("/auth/login", authController.Login)

    //đăng xuất
    Router.get("/auth/logout", authController.Logout)

    //thêm thiết bị
        //api kiểm tra  địa chỉ mac đã được thêm vào hệ thống hay chưa
        Router.get("/add/:mac", homeController.checkAddStationByMac)

        //api tìm địa chỉ MAC chưa được thêm để thêm
        Router.get("/add", homeController.checkAddStation)

        //api thêm mới điểm đo
        Router.post("/stations", homeController.addStation)

        //api xóa điểm đo
        Router.delete("/stations/:mac",homeController.deleteStation)


    

    





    return app.use("/", Router)
}

export default initWebRoute