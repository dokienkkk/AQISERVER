//collapse sidebar
$(".collapse-button").click(function () {
    $(".sidebar").toggleClass('sidebar--collapse')
    $(this).toggleClass('collapse-button--reverse')
})

//active item a
$(".sidebar__navigation__route").click(function () {
    $(".sidebar__navigation__route").removeClass("active")
    if (!$(this).hasClass("active")) {
        $(this).addClass("active")
    }
})

//lấy thông tin trạm đo hiển thị ra view 
function renderStation() {
    let search = $("input#search").val()
    $.ajax(`http://localhost:8000/stations?search=${search}`, {
        async: false,
        success: function (data) {
            console.log(data)
            $(".table.table-hover").html(`
            <thead>
                <tr>
                    <th>#</th>
                    <th>Vị trí</th>
                    <th>Địa chỉ MAC</th>
                    <th>Ngày thêm</th>
                    <th>Trạng thái</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                
            </tbody>
            `)
            for (let i = 0; i < data.length; i++) {
                $(".table.table-hover tbody").append(`
                <tr>
                    <td>${i + 1}</td>
                    <td>${data[i].name}</td>
                    <td class="mac">${data[i].mac}</td>
                    <td>${formatDate(data[i].created_at)}</td>
                    <td class="status">
                        <i class="fa-solid fa-circle"></i>
                        <span></span>
                    </td>
                    <td class="d-flex">
                        <div class="settings" title="Settings">
                            <input type="hidden" name="setting__name" value="${data[i].name}">
                            <input type="hidden" name="setting__mac" value="${data[i].mac}">
                            <input type="hidden" name="setting__lat" value="${data[i].lat}">
                            <input type="hidden" name="setting__lng" value="${data[i].lng}">
                            <i class="fa-solid fa-pen-to-square"></i>
                            Chỉnh sửa
                        </div>
                        <div class="delete" title="Delete">
                            <input type="hidden" name="" value="${data[i].mac}">
                            <i class="fa-solid fa-trash"></i>
                            Xóa
                        </div>
                    </td>
                </tr>
                `)
            }
        },
        error: function () {
        }
    });
    //load status station
    loadStatus()
}

//hàm hiển thị ngày thêm trạm đo:
function formatDate(date) {
    // console.log(typeof date)
    date = new Date(date)
    let day = date.getDate()
    let month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1)
    let year = date.getFullYear()
    return day + "/" + month + "/" + year
}
renderStation()

// Viết hàm load trạng thái của trạm đo
function loadStatus() {
    $(".table.table-hover tbody .mac").each(function () {
        let mac = $(this).text()
        let icon = $(this).siblings(".status").find("i")
        let status = $(this).siblings(".status").find("span")
        // console.log(icon)
        $.ajax(`http://localhost:8000/admin/status/${mac}`, {
            // async : false,
            success: function (data) {
                if (data.status == "online") {
                    //online
                    if (icon.hasClass("online")) {
                        return
                    } else {
                        icon.addClass("online")
                        status.text("Online")
                    }
                } else {
                    //offline
                    if (icon.hasClass("online")) {
                        icon.removeClass("online")
                        status.text("Offline")
                    } else {
                        status.text("Offline")
                        return
                    }
                }
            },
            error: function () {
            }
        });
    })
}

//load status của trạm đo liên tục 30s/ 1 lần
setInterval(function () {
    console.log("Load Status Station")
    loadStatus()
}, 30000)

//tìm kiếm thiết bị mới khi click " Thêm thiết bị"
$(".add-new").click(function () {
    //fetch dữ liệu trong bảng add xem có địa chỉ mac nào có statusAdd = 0 không
    $.ajax(`/add`, {
        // async : false,
        success: function (data) {
            if (data.status) {
                $("#modal-alert p").text("Không tìm thấy thiết bị mới !")
                $('#update-change').val('0')
                $('#update-change').text('OK')
                $("#modal-alert").modal("show")
            } else {
                // alert("Tìm thấy thiết bị mới có địa chỉ MAC: " + data[0].mac)
                $("#modalAddStation #add__station--mac").val(`${data[0].mac}`)
                $("#modal-alert p").text("Tìm thấy thiết bị mới. Địa chỉ MAC: " + data[0].mac)
                $('#update-change').val('1');
                $('#update-change').text('Thêm điểm đo')
                $("#modal-alert").modal("show")
            }
        },
        error: function () {
        }
    });
})

//modal thêm thiết bị mới
$("#update-change").click(function () {
    if ($(this).val() == "0") {
        //thông báo bình thường
        $("#modal-alert").modal("hide")
    } else if ($(this).val() == "1") {
        //mở form thêm thiết bị
        $("#modal-alert").modal("hide")
        $("#modalAddStation").modal("show")
    } else if ($(this).val() == "2") {
        //sau khi ajax thêm/sửa/xóa thành công
        window.location.reload()
    }
})

//POST add station
$("#btn_add_station").click(() => {
    const mac = $("#modalAddStation #add__station--mac").val()
    const name = $("#modalAddStation #add__station--name").val()
    const lat = $("#modalAddStation #add__station--lat").val()
    const lng = $("#modalAddStation #add__station--lng").val()
    if (!mac || !name || !lat || !lng) {
        $("#modal-alert p").text("Bạn cần nhập đủ thông tin")
        $('#update-change').val('0');
        $('#update-change').text('OK')
        $("#modal-alert").modal("show")
        return
    }
    let data = {
        name,
        lat,
        lng,
        mac
    }
    $.ajax({
        type: 'POST',
        url: '/stations/',
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(data),
        dataType: 'json',
        success: function (response) {
            console.log(response)
            //Hiển thị modal alert thông báo:
            $("#modalAddStation").modal("hide")
            $("#modal-alert p").text(response.status)
            $('#update-change').val('2');
            $('#update-change').text('OK')
            $("#modal-alert").modal("show")
        },
        error: function (error) {
            console.log(error);
        }
    });
})

//modal thay đổi thông tin điểm đo (đổi tên)
$(".settings").click(function () {
    let name = $(this).find("input[name='setting__name']").val()
    let mac = $(this).find("input[name='setting__mac']").val()
    let lat = $(this).find("input[name='setting__lat']").val()
    let lng = $(this).find("input[name='setting__lng']").val()

    $("#modalChangeInfo #add__station--name").val(name)
    $("#modalChangeInfo #add__station--mac").val(mac)
    $("#modalChangeInfo #add__station--lat").val(lat)
    $("#modalChangeInfo #add__station--lng").val(lng)
    $("#modalChangeInfo").modal("show")
})

//change info station: UPDATE 
$("#btn_change_station").click(function () {
    const mac = $("#modalChangeInfo #add__station--mac").val()
    const name = $("#modalChangeInfo #add__station--name").val()
    if (!mac || !name) {
        $("#modal-alert p").text("Bạn cần nhập đủ thông tin")
        $('#update-change').val('0');
        $('#update-change').text('OK')
        $("#modal-alert").modal("show")
        return
    }
    let data = {
        name
    }
    $.ajax({
        type: 'PUT',
        url: `/stations/${mac}`,
        contentType: "application/json;charset=utf-8",
        data: JSON.stringify(data),
        dataType: 'json',
        success: function (response) {
            console.log(response)
            //Hiển thị modal alert thông báo:
            $("#modalChangeInfo").modal("hide")
            $("#modal-alert p").text(response.status)
            $('#update-change').val('2');
            $('#update-change').text('OK')
            $("#modal-alert").modal("show")
        },
        error: function (error) {
            console.log(error);
        }
    });

})

//reset lại thông tin các input khi đóng modal add station
$("#modalAddStation").on('hidden.bs.modal', function (e) {
    $("#add__station--lng").val("")
    $("#add__station--name").val("")
    $("#add__station--lat").val("")
    $("#add__station--lng").val("")
})


//xóa điểm đo
$(".delete").click(function () {
    const mac = $(this).find("input").val()
    $.ajax({
        type: 'DELETE',
        url: `/stations/${mac}`,
        contentType: "application/json;charset=utf-8",
        // data: JSON.stringify(data),
        // dataType: 'json',
        success: function (response) {
            console.log(response)
            //Hiển thị modal alert thông báo:
            $("#modal-alert p").text(response.status)
            $('#update-change').val('2');
            $('#update-change').text('OK')
            $("#modal-alert").modal("show")
        },
        error: function (error) {
            console.log(error);
        }
    });

})


$('input#search').on('keyup', function () {
    renderStation()
})


