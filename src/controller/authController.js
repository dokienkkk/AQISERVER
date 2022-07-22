import pool from "../configc/connectDB";

const Login = async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    console.log(username)
    console.log(password)
    let [user, other] = await pool.execute(`select * from user where username = '${username}' and password = '${password}'`)
    if (user[0]) {
        // console.log(user[0])
        req.session.username = user[0].username
        res.redirect("/admin/home")
    } else {
        res.render("login", { err: "Sai tài khoản hoặc mật khẩu" })
    }
}

const Logout = (req, res) => {
    req.session.username = null
    res.render("login", { err: "" })
}

module.exports = {
    Login,
    Logout
}