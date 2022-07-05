import formatDate from "../utils/date"
import formatHour from "../utils/hour"
import pool from "../configc/connectDB"


const getHomePage = async (req, res) => {
    let [stations,other] = await pool.execute('select * from station')
    // console.log(stations)
    res.render('index', {stations})
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

const getAQI = async (req,res) => {
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
    let [id,other5] = await pool.execute(`select id from station where mac = '${mac}'`)
    id = id[0].id
    let kCO = 0;

    const I = [0,50,100,150,200,300,400,500]
    const CO = [0,10000,30000,45000,60000,90000,120000,150000]
    //get data gio` gan` nhat trong bang de tinh chi so AQI
    let [datas, other] = await pool.execute(`select * from data where mac = '${mac}' AND hour(time) = (select hour(time) from data order by time desc limit 1)`)
    let averageCO = 0
    let sumCO = 0
    for(let data of datas) {
        sumCO += data.co
    }
    averageCO = sumCO / datas.length * 1000

    //don vi cua CO o day la ug/m3
    // console.log(averageCO)

    for(let i = 0 ; i < CO.length; i++) {
        if (averageCO >= CO[i]) kCO = i+1;
    }
    //console.log(kCO)
    let AQIco = (I[kCO] - I[kCO-1]) / (CO[kCO] - CO[kCO-1]) * averageCO + I[kCO-1]
    // console.log("AQIco : " + AQIco)

    let kP25 = 0, kP10 = 0;
    // const I = [0,50,100,150,200,300,400,500]
    const P25 = [0,25,50,80,150,250,350,500]
    const P10 = [0,50,150,250,350,420,500,600]
    let AQIp25 = 0, AQIp10 = 0,NowCastP25 = 0,NowCastP10 = 0;
    //lay ra gia tri trung binh cua p25 12h gan nhat
    let [avgP25,other3] = await pool.execute(`select avg(p25) as averageP25,hour(time) as hour from data where mac='${mac}' AND time between date_add((select time from data order by time desc limit 1), interval -12 hour) and (select time from data order by time desc limit 1) group by hour(time) order by hour(time) desc;`)
    // console.log(avgP25)
    if(avgP25.length < 2) {
        AQIp25 = 1; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {

        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP25 = avgP25[0].averageP25
        for(let i of avgP25) {
            if (maxP25 < i.averageP25) maxP25 = i.averageP25
        }
        //tìm giá trị nhỏ nhất
        let minP25 = avgP25[0].averageP25
        for(let i of avgP25) {
            if (minP25 > i.averageP25) minP25 = i.averageP25
        }
        let w = minP25 / maxP25
        // console.log(w)
        if ( w <= 0.5) {
            w = 0.5
            for(let i = 0; i < avgP25.length; i++) {
                NowCastP25 += Math.pow(0.5,i+1) * avgP25[i].averageP25
                // console.log("NC "+ i + ":" + NowCastP25)
            }
        } else {
            let TS = 0, MS = 0;
            for(let i = 0; i < avgP25.length; i++) {
                TS += Math.pow(w,i) * avgP25[i].averageP25
                MS += Math.pow(w,i)
            }
            NowCastP25 = TS/MS
        }
        // console.log("NowCast: "+ NowCastP25)
        for(let i = 0 ; i < P25.length; i++) {
            if (NowCastP25 >= P25[i]) kP25 = i+1;
        }
        //console.log(kCO)
        AQIp25 = (I[kP25] - I[kP25-1]) / (P25[kP25] - P25[kP25-1]) * NowCastP25 + I[kP25-1]
        
    }
    //lay ra gia tri trung binh cua p10 12h gan nhat
    let [avgP10,other2] = await pool.execute(`select avg(p10) as averageP10,hour(time) as hour from data where mac = '${mac}' AND time between date_add((select time from data order by time desc limit 1), interval -12 hour) and (select time from data order by time desc limit 1) group by hour(time) order by hour(time) desc;`)
    // console.log(avgP10)
    if(avgP10.length < 2) {
        AQIp10 = 1; //không đủ dữ liệu trung bình của 2/12 giờ gần nhất
    } else {
        //tính cmin/cmax 
        //tìm giá trị lớn nhất
        let maxP10 = avgP10[0].averageP10
        for(let i of avgP10) {
            if (maxP10 < i.averageP10) maxP10 = i.averageP10
        }
        //tìm giá trị nhỏ nhất
        let minP10 = avgP10[0].averageP10
        for(let i of avgP10) {
            if (minP10 > i.averageP10) minP10 = i.averageP10
        }
        let w = minP10 / maxP10
        if ( w <= 0.5) {
            w = 0.5
            for(let i = 0; i < avgP10.length; i++) {
                NowCastP10 += Math.pow(0.5,i+1) * avgP10[i].averageP10
            }
        } else {
            let TS = 0, MS = 0;
            for(let i = 0; i < avgP10.length; i++) {
                TS += Math.pow(0.5,i) * avgP10[i].averageP10
                MS += Math.pow(0.5,i)
            }
            NowCastP10 = TS/MS
        }
        for(let i = 0 ; i < P10.length; i++) {
            if (NowCastP10 >= P10[i]) kP10 = i+1;
        }
        AQIp10 = (I[kP10] - I[kP10-1]) / (P10[kP10] - P10[kP10-1]) * NowCastP10 + I[kP10-1]
        
    }
    let AQI = Math.floor(Math.max(AQIco,AQIp25,AQIp10))
    console.log("AQIco : " + AQIco)
    console.log("AQIp25 : " + AQIp25)
    console.log("AQIp10 : " + AQIp10)
    console.log("AQI: " +AQI)
    res.json({id,AQI}) 
}

const getDataChart = async (req,res) => {
    let val = req.params.val
    let mac = req.params.mac
    //let [result,other] = await pool.execute(`select ${val},time from data where mac = '${mac}' AND hour(time) = (select hour(time) from data order by time desc limit 1)`)
    let [result,other] = await pool.execute(`select ${val},time from data where mac = '${mac}' AND date(time) = (select date(time) from data order by time desc limit 1)`)

    let valArr = []
    let time = []
    for(let i = 0; i < result.length; i++) {
        result[i][`${val}`] = result[i][`${val}`].toFixed(1)
        valArr.push(result[i][`${val}`])
        //time.push(formatHour(result[i].time))
        time.push((result[i].time))
    }
    res.json({valArr,time})
}

const getNewData = async (req,res) => {
    let mac = req.params.mac
    let [result,other] = await pool.execute(`select * from data where mac = '${mac}' order by time desc limit 1`)

    let [nameStation, other2] = await pool.execute(`select name from station where mac = '${mac}'`)
    let resultFinal = [...result,...nameStation]
    res.json(resultFinal)
}

const getStations = async (req,res) => {
    let [result,other] = await pool.execute('select * from station ')
    res.json(result)
}

const testpost = async(req,res) => {
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
}

const getInfoPage = (req,res) => {
    res.render("info")
}



module.exports = {
    getHomePage,
    getData,
    getAQI,
    getDataChart,
    getNewData,
    getStations,
    getInfoPage,
    testpost
}