$(".toggle-password").click(function () {
    alert("CLick icon")
    $(this).toggleClass("fa-eye fa-eye-slash");
    var input = $(".pas input");
    if (input.attr("type") == "password") {
        input.attr("type", "text");
    } else {
        input.attr("type", "password");
    }
});