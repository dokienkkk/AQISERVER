const AQIValue = [
    {
        val: 0,
        status: "Tốt",
        color: "#00e400",
        text: "Không ảnh hưởng đến sức khỏe"
    },
    {
        val: 51,
        status: "Trung bình",
        color: "#ffff00",
        text: "Ở mức chấp nhận được. Nhóm nhạy cảm nên hạn chế thời gian ra ngoài"
    },
    {
        val: 101,
        status: "Kém",
        color: "#ff7e00",
        text: "Ảnh hưởng xấu đến sức khỏe. Nhóm nhạy cảm nên hạn chế thời gian ra ngoài"
    },
    {
        val: 151,
        status: "Xấu",
        color: "#ff0000",
        text: "Nhóm nhạy cảm tránh ra ngoài. Những người khác hạn chế ra ngoài"
    },
    {
        val: 201,
        status: "Rất Xấu",
        color: "#8f3f97",
        text: "Cảnh báo sức khỏe khẩn cấp.Ảnh hưởng đến tất cả cư dân"
    },
    {
        val: 301,
        status: "Nguy Hại",
        color: "#7e0023",
        text: "Báo động: có thể ảnh hưởng nguy hại đến sức khỏe mọi người"
    }
]
//hàm trả về chất lượng không khí
const qualityValue = (aqi) => {
    let k;
    for (let i = 0; i < AQIValue.length; i++) {
        if (aqi >= AQIValue[i].val) k = i;
    }
    return AQIValue[k].status
}


//load các trạm đo cho vào thẻ select
function loadStations() {
    $.ajax(`http://localhost:8000/stations`, {
        async: false,
        success: function (data) {
            for (let i = 0; i < data.length; i++) {
                $("select#stations").append(`
                    <option value="${data[i].mac}">
                        ${data[i].name}
                    </option>
                `)
            }

        },
        error: function () {
        }
    });
}

loadStations()

//default value today input date
function defaultToday() {
    let date = new Date()
    year = date.getFullYear()
    month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)
    day = date.getDate() + 1 < 10 ? "0" + date.getDate() : date.getDate()
    let today = year + "-" + month + "-" + day
    document.getElementById("date").defaultValue = today
}

defaultToday()

//lấy danh sách chỉ số AQI của trạm đo theo ngày
function loadAQI() {
    let mac = $('select#stations').val()
    let nameStation = $('select#stations option:selected').text()
    let date = $("#date").val()
    let dateFormat = formatDate(date)
    $.ajax(`http://localhost:8000/get/${mac}/${date}`, {
        async: false,
        success: function (data) {
            if (data.status) {
                $(".content__body").html("<h2>Không có dữ liệu</h2>")
            } else {
                $(".content__body").html(`
                    <div class="table-responsive">
                        <div class="table-wrapper">
                            <div class="table-title">
                                <div class="row">
                                    <div class="col-sm-9">
                                        <h2>Chỉ số chất lượng không khí</h2>
                                    </div>
                                    <div class="col-sm-3">
                                        <div class="table__download">
                                            <i class="fa-solid fa-download"></i>
                                            <span>Tải xuống dữ liệu</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <table id="aqi__data" class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Điểm đo</th>
                                        <th>Ngày</th>
                                        <th>Giờ</th>
                                        <th>Nhiệt độ (°C)</th>
                                        <th>Độ ẩm (%)</th>
                                        <th>Khí CO (mg/m3)</th>
                                        <th>Bụi PM2.5 (µg/m3)</th>
                                        <th>Bụi PM10 (µg/m3)</th>
                                        <th>Chỉ số AQI</th>
                                        <th>Chất lượng không khí</th>
                                    </tr>
                                </thead>
                                <tbody>
                                
                                </tbody>
                            </table>
                        </div>
                    </div>
                `)
                for (let i = data.length - 1; i >= 0; i--) {
                    $(".table tbody").append(`
                    <tr>
                        <td>${nameStation}</td>
                        <td>${dateFormat}</td>
                        <td>${data[i].hour}h</td>
                        <td>${data[i].temp}</td>
                        <td>${data[i].humi}</td>
                        <td>${data[i].co}</td>
                        <td>${data[i].p25}</td>
                        <td>${data[i].p10}</td>
                        <td>${data[i].AQI}</td>
                        <td>${qualityValue(data[i].AQI)}</td>
                    </tr>
                `)
                }


            }

        },
        error: function () {
        }
    });
    download('xlsx')
}
loadAQI()

$("#date").on("change", function () {
    loadAQI()
})

$("select#stations").on("change", function () {
    loadAQI()
})

// Download du lieu
function download(type) {
    $(".table__download").click(function () {
        let data = document.getElementById('aqi__data')
        let file = XLSX.utils.table_to_book(data, {sheet: "sheet1"})
        file["Sheets"]["sheet1"]["!cols"] = [{ wpx : 68 },{ wpx : 68 },{ wpx : 42 },{ wpx : 70 },{ wpx : 58 },{ wpx : 82 },{ wpx : 96 },{ wpx : 96 },{ wpx : 62 },{ wpx : 110 }];
        XLSX.write(file, { bookType: type, bookSST: true, type: 'base64' })
        XLSX.writeFile(file, 'file.' + type);
    })
}
