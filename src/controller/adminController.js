import pool from "../configc/connectDB"

const getLoginPage = (req, res) => {
    res.render("login", { err: "" })
}

//lấy status online/offline của tram đo
const getStatus = async (req, res) => {
    const mac = req.params.mac
    //lấy thời gian gửi dữ liệu lên gần nhất của trạm đo
    let [time, other] = await pool.execute(`select time from data where mac = '${mac}' order by time desc limit 1`)
    if (!(time.length > 0)) {
        return res.json({ "status": "offline" })
    }
    let current = (new Date()).getTime()
    let lastTime = (new Date(time[0].time)).getTime()
    var diff = Math.abs(current - lastTime);
    //nếu quá 5 phút không gửi lên thì là offline
    if (diff > 300000) {
        return res.json({ "status": "offline" })
    } else {
        return res.json({ "status": "online" })
    }
}

const getAdminHomePage = async (req, res) => {
    if (!req.session.username) {
        return res.redirect("/admin/login")
    }
    //lấy thông tin user từ session
    const username = req.session.username

    //lấy danh sách các điểm đo (station) từ db
    let [stations, other] = await pool.execute('select * from station')
    // console.log(stations)
    // console.log("User đăng nhập : " + username)
    return res.render("admin/admin.ejs", { username })
}

const getAdminMapPage = (req, res) => {
    if (!req.session.username) {
        return res.redirect("/admin/login")
    }
    //lấy thông tin user từ session
    const username = req.session.username
    return res.render("admin/map.ejs", { username })
}

const getAdminStatsPage = (req, res) => {
    if (!req.session.username) {
        return res.redirect("/admin/login")
    }
    //lấy thông tin user từ session
    const username = req.session.username
    return res.render("admin/stats.ejs", { username })
}

module.exports = {
    getLoginPage,
    getStatus,
    getAdminHomePage,
    getAdminMapPage,
    getAdminStatsPage
}