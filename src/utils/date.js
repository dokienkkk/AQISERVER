
const formatDate = date => {
    let minute = date.getMinutes() <= 9 ? "0" + date.getMinutes() : date.getMinutes()
    return date.getDate() + "/"
        + (date.getMonth() + 1) + "/"
        + date.getFullYear() + " - "
        + date.getHours() + ":"
        + minute + ":"
        + date.getSeconds();
}

export default formatDate 
    