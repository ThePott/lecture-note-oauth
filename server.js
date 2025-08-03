const express = require("express")
const cors = require("cors")
const axios = require("axios")
const dotenv = require("dotenv")
dotenv.config()

const kakaoClientId = process.env.KAKAO_CLIENT_ID
const redirectUri = "http://localhost:5500"
const app = express()
app.use(express.json())
app.use(express.text())

const corsOptions = {
    origin: ["http://localhost:5500", "http://127.0.0.1:5500",],
    methods: ["OPTIONS", "GET", "POST", "DELETE"],
    // allowedHeaders: ["Content-Type"],
}
app.use(cors(corsOptions))

app.get("/kakao/client-id", (req, res) => {
    console.log("---- server here")
    res.status(200).send(kakaoClientId)
})

const getKakaoToken = async (authorizationCode) => {
    url = `https://kauth.kakao.com/oauth/token`
    const response = await axios.post(
        url,
        { grant_type: "authorization_code", client_id: kakaoClientId, redirect_uri: redirectUri, code: authorizationCode },
        { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" } }
    )
    const accessToken = response.data.access_token
    console.log("----- access token in server:", accessToken)
    return accessToken
}

app.post("/kakao/code-to-token", async (req, res) => {
    const authorizationCode = req.body
    console.log("--- aut code:", authorizationCode)
    const accessToken = await getKakaoToken(authorizationCode)
    res.cookie("kakao_access_token", accessToken)
    res.status(200).send(accessToken)
})

app.post("/kakao/user-info", async (req, res) => {
    const accessToken = req.body
    // ----- veryfy 해야할 거 같은데? 아닌가? 아니지 이건 그냥 토큰이지 jwt는 아니니까? 맞다, jwt가 아닌 그냥 토큰이다
    if (!accessToken) { res.status(400).send("---- ERROR: Invalid request") }
    const url = "https://kapi.kakao.com/v2/user/me"
    const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `application/x-www-form-urlencoded;charset=utf-8`
    }
    const response = await axios.get(url, { headers })
    // console.log("---- user info response:", response.data)
    const userInfo = response.data.properties
    res.status(200).json(userInfo)

})

app.post("/kakao/logout", async (req, res) => {
    const accessToken = req.headers.authorization.split(" ")[1]
    if (!accessToken) {
        res.status(400).send("Invalid request")
        console.error("---- fail to get access token")
        return
    }

    console.log("---- here")
    const _response = await axios.post(
        "https://kapi.kakao.com/v1/user/logout",
        undefined,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
    )

    // console.log("---- logout response in server:", response.data)

    res.send("---- logout success")
})


app.listen(3000, () => console.log("server is on port 3000"))
