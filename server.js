const express = require("express")
const cors = require("cors")
const axios = require("axios")
const dotenv = require("dotenv")
dotenv.config()

const kakaoClientId = process.env.KAKAO_CLIENT_ID
const naverState = process.env.NAVER_STATE
const naverClientId = process.env.NAVER_CLIENT_ID
const naverClientSecret = process.env.NAVER_CLIENT_SECRET

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

app.get("/kakao/env", (req, res) => {
    res.status(200).send(kakaoClientId)
})

app.post("/kakao/code-to-token", async (req, res) => {
    const authorizationCode = req.body

    url = `https://kauth.kakao.com/oauth/token`
    const response = await axios.post(
        url,
        { grant_type: "authorization_code", client_id: kakaoClientId, redirect_uri: redirectUri, code: authorizationCode },
        { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" } }
    )
    const accessToken = response.data.access_token

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


app.get("/naver/env", async (req, res) => {
    res.json({ naverState, naverClientId, naverClientSecret })
})

app.post("/naver/code-to-token", async (req, res) => {
    const authorizationCode = req.body
    console.log("---- in server naver auth code:", authorizationCode)

    const url = `https://nid.naver.com/oauth2.0/token?client_id=${naverClientId}&client_secret=${naverClientSecret}&grant_type=authorization_code&state=${naverState}&code=${authorizationCode}`
    const response = await axios.get(url)
    const { access_token, refresh_token } = response.data

    res.status(200).json({ access_token, refresh_token })
})

app.get("/naver/user-info", async (req, res) => {
    const naverAccessToken = req.headers.authorization.split(" ")[1]
    const response = await axios.get("https://openapi.naver.com/v1/nid/me", { headers: { "Authorization": `Bearer ${naverAccessToken}` } })
    const { name, profile_image } = response.data.response
    console.log("--- in server user info:", name, profile_image, response.data)
    res.json({ name, profile_image })
})

app.post("/naver/logout", async (req, res) => {
    const naverAccessToken = req.headers.authorization.split(" ")[1]
    console.log("---- in server token:", naverAccessToken)
    if (!naverAccessToken) {
        res.status(400).send("Invalid request")
    }
    const url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${naverClientId}&client_secret=${naverClientSecret}&access_token=${naverAccessToken}&service_provider=NAVER`
    const _response = await axios.post(url)
    res.status(200).send("---- 네이버 로그아웃 성공!")
})

app.listen(3000, () => console.log("server is on port 3000"))
