const formatHour = date => {
    let hour = date.getHours() + ":" 
    let min =  date.getMinutes() <= 9 ? "0" + date.getMinutes() : date.getMinutes()
    return hour + min
}

export default formatHour