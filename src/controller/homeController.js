import formatDate from "../utils/date"
import formatHour from "../utils/hour"
import pool from "../configc/connectDB"
import { resolveShowConfigPath } from "@babel/core/lib/config/files"


const getHomePage = async (req, res) => {
    let [stations, other] = await pool.execute('select * from station')
    // console.log(stations)
    res.render('index', { stations })
}

const getData = async (req, res) => {
    // const idStation = req.params.id
    const mac = req.query.mac
    const temp = req.query.temp
    const humd = req.query.humd
    const co = req.query.co
    const p25 = req.query.p25
    const p10 = req.query.p10
    const date = new Date()
    const time = formatDate(date)
    console.log({ temp, humd, co, p25, p10, time })
    await pool.execute(`insert into data (mac,temp,humi,co,p25,p10) values('${mac}','${temp}','${humd}','${co}','${p25}','${p10}')`)
}

const getAQI = async (req, res) => {
    /**
     * AQIx : giá trị AQI của thông số x
     * BPi: Nồng độ giới hạn dưới của giá trị thông số quan trắc
     *      được quy định trong bảng 2 tương ứng với mức i
     * BPi+1: Nồng độ giới hạn trên của giá trị thông số quan trắc
     *      được quy định trong bảng 2 tương ứng với mức i+1
     * Ii : Giá trị AQI ở mức i đã cho tương ứng với giá trị BPi
     * Ii+1: Giá trị AQI ở mức i+1 cho trong bảng tương ứng với
     *       giá trị BPi+1 
     * Cx: GIá trị quan trắc trung bình 1h của thông số x
     * NowCast-x: Giá trị NowCast dùng để tính AQI pm2.5 và pm10
     */

    //lấy địa chỉ MAC:
    const mac = req.params.mac
    let [id, other5] = await pool.execute(`select id from station where mac = '${mac}'`)
    id = id[0].id

    let kCO = 0;
    const I = [0, 50, 100, 150, 200, 300, 400, 500]
    const CO = [0, 10000, 30000, 45000, 60000, 90000, 120000, 150000]
    //get data gio` gan` nhat trong bang de tinh chi so AQI
    let [datas, other] = await pool.execute(`select * from data where mac = '${mac}' AND hour(time) = (select hour(time) from data order by time desc limit 1)`)
    let averageCO = 0
    let sumCO = 0
    for (let data of datas) {
        sumCO += data.co
    }
    averageCO = sumCO / datas.length * 1000

    //don vi cua CO o day la ug/m3
    // console.log(averageCO)

    for (let i = 0; i < CO.length; i++) {
        if (averageCO >= CO[i]) kCO = i + 1;
    }
    //console.log(kCO)
    let AQIco = (I[kCO] - I[kCO - 1]) / (CO[kCO] - CO[kCO - 1]) * averageCO + I[kCO - 1]
    // console.log("AQIco : " + AQIco)

    let kP25 = 0, kP10 = 0;
    // const I = [0,50,100,150,200,300,400,500]
    const P25 = [0, 25, 50, 80, 150, 250, 350, 500]
    const P10 = [0, 50, 150, 250, 350, 420, 500, 600]
    let AQIp25 = 0, AQIp10 = 0, NowCastP25 = 0, NowCastP10 = 0;
    //lay ra gia tri trung binh cua p25 12h gan nhat
    let [avgP25, other3] = await pool.execute(`select avg(p25) as averageP25,hour(time) as hour from data where mac='${mac}' AND time between date_add((select time from data order by time desc limit 1), interval -12 hour) and (select time from data order by time desc limit 1) group by hour(time) order by hour(time) desc;`)
    // console.log(avgP25)
    if (avgP25.length < 2) {
        AQIp25 = 1; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {

        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP25 = avgP25[0].averageP25
        for (let i of avgP25) {
            if (maxP25 < i.averageP25) maxP25 = i.averageP25
        }
        //tìm giá trị nhỏ nhất
        let minP25 = avgP25[0].averageP25
        for (let i of avgP25) {
            if (minP25 > i.averageP25) minP25 = i.averageP25
        }
        let w = minP25 / maxP25
        // console.log(w)
        if (w <= 0.5) {
            w = 0.5
            for (let i = 0; i < avgP25.length; i++) {
                NowCastP25 += Math.pow(0.5, i + 1) * avgP25[i].averageP25
                // console.log("NC "+ i + ":" + NowCastP25)
            }
        } else {
            let TS = 0, MS = 0;
            for (let i = 0; i < avgP25.length; i++) {
                TS += Math.pow(w, i) * avgP25[i].averageP25
                MS += Math.pow(w, i)
            }
            NowCastP25 = TS / MS
        }
        // console.log("NowCast: "+ NowCastP25)
        for (let i = 0; i < P25.length; i++) {
            if (NowCastP25 >= P25[i]) kP25 = i + 1;
        }
        //console.log(kCO)
        AQIp25 = (I[kP25] - I[kP25 - 1]) / (P25[kP25] - P25[kP25 - 1]) * NowCastP25 + I[kP25 - 1]

    }
    //lay ra gia tri trung binh cua p10 12h gan nhat
    let [avgP10, other2] = await pool.execute(`select avg(p10) as averageP10,hour(time) as hour from data where mac = '${mac}' AND time between date_add((select time from data order by time desc limit 1), interval -12 hour) and (select time from data order by time desc limit 1) group by hour(time) order by hour(time) desc;`)
    // console.log(avgP10)
    if (avgP10.length < 2) {
        AQIp10 = 1; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {
        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP10 = avgP10[0].averageP10
        for (let i of avgP10) {
            if (maxP10 < i.averageP10) maxP10 = i.averageP10
        }
        //tìm giá trị nhỏ nhất
        let minP10 = avgP10[0].averageP10
        for (let i of avgP10) {
            if (minP10 > i.averageP10) minP10 = i.averageP10
        }
        let w = minP10 / maxP10
        if (w <= 0.5) {
            w = 0.5
            for (let i = 0; i < avgP10.length; i++) {
                NowCastP10 += Math.pow(0.5, i + 1) * avgP10[i].averageP10
            }
        } else {
            let TS = 0, MS = 0;
            for (let i = 0; i < avgP10.length; i++) {
                TS += Math.pow(0.5, i) * avgP10[i].averageP10
                MS += Math.pow(0.5, i)
            }
            NowCastP10 = TS / MS
        }
        for (let i = 0; i < P10.length; i++) {
            if (NowCastP10 >= P10[i]) kP10 = i + 1;
        }
        AQIp10 = (I[kP10] - I[kP10 - 1]) / (P10[kP10] - P10[kP10 - 1]) * NowCastP10 + I[kP10 - 1]

    }
    let AQI = Math.round(Math.max(AQIco, AQIp25, AQIp10))
    res.json({ id, AQI })
}

const getDataChart = async (req, res) => {
    let val = req.params.val
    let mac = req.params.mac
    //let [result,other] = await pool.execute(`select ${val},time from data where mac = '${mac}' AND hour(time) = (select hour(time) from data order by time desc limit 1)`)
    let [result, other] = await pool.execute(`select ${val},time from data where mac = '${mac}' AND date(time) = (select date(time) from data order by time desc limit 1)`)

    let valArr = []
    let time = []
    for (let i = 0; i < result.length; i++) {
        result[i][`${val}`] = result[i][`${val}`].toFixed(1)
        valArr.push(result[i][`${val}`])
        //time.push(formatHour(result[i].time))
        time.push((result[i].time))
    }
    res.json({ valArr, time })
}

const getNewData = async (req, res) => {
    let mac = req.params.mac
    let [result, other] = await pool.execute(`select * from data where mac = '${mac}' order by time desc limit 1`)

    let [nameStation, other2] = await pool.execute(`select name from station where mac = '${mac}'`)
    let resultFinal = [...result, ...nameStation]
    // console.log('ESP32 Get Data')
    res.json(resultFinal)
}

const getStations = async (req, res) => {
    let search = ""
    if (req.query.search) {
        search = req.query.search
        console.log(search)
    }
    let [result, other] = await pool.execute(`select * from station where name like '%${search}%'`)
    res.json(result)
}

const testpost = async (req, res) => {
    console.log(req.body)
    const mac = req.body.mac
    const temp = req.body.temp
    const humd = req.body.humd
    const co = req.body.co
    const p25 = req.body.p25
    const p10 = req.body.p10
    const date = new Date()
    const time = formatDate(date)
    console.log({ temp, humd, co, p25, p10, time })

    await pool.execute(`insert into data (mac,temp,humi,co,p25,p10) values('${mac}','${temp}','${humd}','${co}','${p25}','${p10}')`)
    res.json({ "status": "OK" })
}

const getInfoPage = (req, res) => {
    res.render("info")
}

const dck = (req, res) => {
    console.log("ESP32 Post dữ liệu lên thành công")
    console.log("Dữ liệu gửi lên: " + req.body)
    res.send("Server DCK đã nhận được dữ liệu")
}




//lấy chỉ số AQI theo ngày của trạm đo
const getAQIperDate = async (req, res) => {
    const mac = req.params.mac
    const date = req.params.date
    let [hours, other] = await pool.execute(`SELECT HOUR(time) as hour FROM data WHERE mac = '${mac}' and DATE(time) = '${date}' GROUP BY HOUR(time) ORDER BY HOUR(time) DESC;`)
    //hour ở đây là chỉ số trung bình group theo các giờ

    let result = []

    if (!(hours.length > 0)) {
        //nếu không có dữ liệu thì trả về status
        return res.json({ "status": "Không có dữ liệu" })
    } else {
        //nếu có dữ liệu thì tính chỉ số AQI của từng giờ
        for (let i = 0; i < hours.length; i++) {
            let hour = hours[i].hour
            let [data, other1] = await pool.execute(`SELECT avg(temp) as temp, avg(humi) as humi,avg(co) as co,avg(p25) as p25, avg(p10) as p10 FROM data WHERE mac = '${mac}' and DATE(time) = '${date}' and HOUR(time) = '${hour}';`)
            let aqi = await calAQI(mac, hours[i].hour, date)
            result.push({
                hour,
                AQI: aqi,
                temp: data[0].temp.toFixed(1),
                humi: data[0].humi.toFixed(1),
                co: data[0].co.toFixed(2),
                p25: data[0].p25.toFixed(2),
                p10: data[0].p10.toFixed(2)
            })
        }
        return res.json(result)
    }
}


//hàm tính chỉ số AQI theo giờ trong ngày của trạm đo
const calAQI = async (mac, hour, date) => {
    const I = [0, 50, 100, 150, 200, 300, 400, 500]
    const CO = [0, 10000, 30000, 45000, 60000, 90000, 120000, 150000]
    const P25 = [0, 25, 50, 80, 150, 250, 350, 500]
    const P10 = [0, 50, 150, 250, 350, 420, 500, 600]

    //lấy giá trị trung bình của CO trong giờ 'hour'
    let [avgCO, other] = await pool.execute(`select avg(co) as co from data where mac = '${mac}' and hour(time) = '${hour}' and date(time) = '${date}'`)


    //tính chỉ số AQI_CO :
    let kCO = 0, kP25 = 0, kP10 = 0;

    if (!avgCO[0].co) {
        avgCO = 0;
    } else {
        avgCO = avgCO[0].co * 1000 //do don vi cua CO o day la ug/m3
    }

    for (let i = 0; i < CO.length; i++) {
        if (avgCO >= CO[i]) kCO = i + 1;
    }
    let AQIco = (I[kCO] - I[kCO - 1]) / (CO[kCO] - CO[kCO - 1]) * avgCO + I[kCO - 1]

    //tính chỉ số AQI_PM2.5:
    let AQIp25 = 0, AQIp10 = 0, NowCastP25 = 0, NowCastP10 = 0;
    //lấy giá trị trung bình PM2.5 12h gần nhất với giờ được chọn (hour)
    //lay ra gia tri trung binh cua p25 12h gan nhat
    let sql = `SELECT avg(p25) as averageP25,HOUR(time) as hour from data WHERE mac = '${mac}' and time BETWEEN DATE_ADD('${date} ${hour}:00:00', INTERVAL -11 HOUR) AND DATE_ADD('${date} ${hour}:00:00', INTERVAL +1 HOUR) GROUP BY HOUR(time) ORDER BY HOUR(time) desc;`
    let [avgP25, other2] = await pool.execute(sql)
    // console.log(avgP25)
    if (avgP25.length < 2) {
        AQIp25 = 0; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {

        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP25 = avgP25[0].averageP25
        for (let i of avgP25) {
            if (maxP25 < i.averageP25) maxP25 = i.averageP25
        }
        //tìm giá trị nhỏ nhất
        let minP25 = avgP25[0].averageP25
        for (let i of avgP25) {
            if (minP25 > i.averageP25) minP25 = i.averageP25
        }
        let w = minP25 / maxP25
        if (w <= 0.5) {
            w = 0.5
            for (let i = 0; i < avgP25.length; i++) {
                NowCastP25 += Math.pow(0.5, i + 1) * avgP25[i].averageP25
            }
        } else {
            let TS = 0, MS = 0;
            for (let i = 0; i < avgP25.length; i++) {
                TS += Math.pow(w, i) * avgP25[i].averageP25
                MS += Math.pow(w, i)
            }
            NowCastP25 = TS / MS
        }
        for (let i = 0; i < P25.length; i++) {
            if (NowCastP25 >= P25[i]) kP25 = i + 1;
        }
        AQIp25 = (I[kP25] - I[kP25 - 1]) / (P25[kP25] - P25[kP25 - 1]) * NowCastP25 + I[kP25 - 1]
    }
    //tính chỉ số AQI_PM10:
    sql = `SELECT avg(p10) as averageP10,HOUR(time) as hour from data WHERE mac = '${mac}' and time BETWEEN DATE_ADD('${date} ${hour}:00:00', INTERVAL -11 HOUR) AND DATE_ADD('${date} ${hour}:00:00', INTERVAL +1 HOUR) GROUP BY HOUR(time) ORDER BY HOUR(time) desc;`
    let [avgP10, other3] = await pool.execute(sql)
    if (avgP10.length < 2) {
        AQIp10 = 0; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {
        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP10 = avgP10[0].averageP10
        for (let i of avgP10) {
            if (maxP10 < i.averageP10) maxP10 = i.averageP10
        }
        //tìm giá trị nhỏ nhất
        let minP10 = avgP10[0].averageP10
        for (let i of avgP10) {
            if (minP10 > i.averageP10) minP10 = i.averageP10
        }
        let w = minP10 / maxP10
        if (w <= 0.5) {
            w = 0.5
            for (let i = 0; i < avgP10.length; i++) {
                NowCastP10 += Math.pow(0.5, i + 1) * avgP10[i].averageP10
            }
        } else {
            let TS = 0, MS = 0;
            for (let i = 0; i < avgP10.length; i++) {
                TS += Math.pow(0.5, i) * avgP10[i].averageP10
                MS += Math.pow(0.5, i)
            }
            NowCastP10 = TS / MS
        }
        for (let i = 0; i < P10.length; i++) {
            if (NowCastP10 >= P10[i]) kP10 = i + 1;
        }
        AQIp10 = (I[kP10] - I[kP10 - 1]) / (P10[kP10] - P10[kP10 - 1]) * NowCastP10 + I[kP10 - 1]
    }
    let AQI = Math.round(Math.max(AQIco, AQIp25, AQIp10))
    return AQI
}

//kiểm tra địa chỉ mac đã được add chưa
const checkAddStationByMac = async (req, res) => {
    const mac = req.params.mac
    let [result, other] = await pool.execute(`select * from add_station where mac = '${mac}'`)
    console.log(result)
    if (!result) {
        //nếu không tìm thấy địa chỉ MAC nào => thiết bị mới lần đầu vào hệ thống
        // => insert vào bảng add_station  với statusAdd default = 0
        await pool.execute(`insert into add_station(mac) values ('${mac}')`)
        return res.send(false)
    } else {
        //nếu có data thì kiểm tra cột statusAdd xem đã được add chưa
        if (result[0].statusAdd) {
            //statusAdd = 1
            //nếu add vị trí, tên rồi thì trả về true
            return res.send(true)
        } else {
            //statusAdd = 0
            //nếu chưa add vị trí, tên thì trả về false
            return res.send(false)
        }
    }
}

const checkAddStation = async (req, res) => {
    let [mac, other] = await pool.execute(`select * from add_station where statusAdd = '0' order by time desc limit 1`)
    if (mac.length < 1) {
        // return res.json(mac)
        return res.json({ status: "không tìm thấy" })
    } else {
        return res.json(mac)
    }
}

const addStation = async (req, res) => {
    const mac = req.body.mac
    const name = req.body.name
    const lat = req.body.lat
    const lng = req.body.lng
    try {
        //add station to db station
        // await pool.execute(`insert into station(name,lat,lng,mac) values('${name}','${lat}','${lng}','${mac}')`)
        //update column statusAdd on db add_station
        await pool.execute(`UPDATE add_station SET statusAdd = '1' WHERE mac = '${mac}';`)

        return res.json({ "status": "Thêm mới điểm đo thành công" })
    } catch (err) {
        console.log(err)
        return res.json({ "status": "Không thể thêm điểm đo" })
    }
}

const deleteStation = async (req, res) => {
    const mac = req.params.mac
    try {
        await pool.execute(`DELETE FROM station WHERE mac = "${mac}"`)
        await pool.execute(`DELETE FROM add_station WHERE mac = "${mac}"`)
        return res.json({ "status": "Xóa điểm đo thành công" })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getHomePage,
    getData,
    getAQI,
    getDataChart,
    getNewData,
    getStations,
    getInfoPage,
    testpost,
    dck,
    getAQIperDate,
    checkAddStationByMac,
    checkAddStation,
    addStation,
    deleteStation
}