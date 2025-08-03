

const kakaoLoginButton = document.querySelector("#kakao-login-button")
const naverLoginButton = document.querySelector("#naver-login-button")

const profileImage = document.querySelector("#profile-image")
const userName = document.querySelector("#user-name")
const logoutButton = document.querySelector("#logout-button")

const redirectUri = "http://localhost:5500"
let kakaoClientId = null
let kakaoAccessToken = null
let naverClientId = null
let naverClientSecret = null
let naverAccessToken = null
let naverState = null

axios.defaults.baseURL = "http://localhost:3000"
axios.defaults.headers.common["Content-Type"] = "text/plain"

const checkThenGetApiKey = async () => {
    if (kakaoClientId) { return }
    const response = await axios.get("/kakao/client-id")
    if (!response || !response.data) { console.error("---- ERROR OCCURRED: Fail to get api key") }
    kakaoClientId = response.data
}

const getKakaoToken = async (authorizationCode) => {
    const accessTokenResponse = await axios.post("/kakao/code-to-token", authorizationCode)
    kakaoAccessToken = accessTokenResponse.data
}

const getKakaoUserInfo = async () => {
    const response = await axios.post("/kakao/user-info", kakaoAccessToken)
    const { nickname, profile_image, thumbnail_image } = response.data
    return { nickname, profile_image, thumbnail_image }
}

const updateProfile = (nickname, profile_image) => {
    userName.innerText = nickname
    profileImage.src = profile_image
}



const kakaoLogout = async () => {
    if (!kakaoAccessToken) {
        console.error("---- ERROR: No access token")
        debugger
        return
    }
    const _response = await axios.post("/kakao/logout", undefined, { headers: { "Authorization": `Bearer ${kakaoAccessToken}` } })
    updateProfile("", "")
}

kakaoLoginButton.addEventListener("click", async () => {
    await checkThenGetApiKey()
    location.href = `https://kauth.kakao.com/oauth/authorize/?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code`
})

/** env -> auth code */
naverLoginButton.addEventListener("click", async () => {
    if (naverClientId && naverClientSecret) { return }

    // env variable 가져오기
    const response = await axios.get("/naver/env")
    naverState = response.data.naverState
    naverClientId = response.data.naverClientId
    naverClientSecret = response.data.naverClientSecret

    // auth code 받기
    location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}&response_type=code&redirect_uri=${redirectUri}&state=${naverState}`
})


logoutButton.addEventListener("click", async () => {
    await kakaoLogout()
})

/** code -> token */
const getNaverAccessToken = async (authorizationCode) => {
    const response = await axios.post("/naver/code-to-token", authorizationCode)
    const {access_token} = response.data
    naverAccessToken = access_token
}

/** token -> user info */
const getNaverUserInfo = async () => {
    const response = await axios.get(
        "/naver/user-info",
        { headers: { "Authorization": `Bearer ${naverAccessToken}` } }
    )
    const {name, profile_image} = response.data
    debugger
    updateProfile(name, profile_image)
}

/** code -> token -> ui */
window.onload = async () => {
    const searchParams = new URLSearchParams(window.location.search)

    const authorizationCode = searchParams.get("code")
    if (!authorizationCode) {
        console.error("---- got no code from kakao even after redirect")
        return
    }

    const isNaver = Boolean(searchParams.get("state"))
    if (isNaver) {
        await getNaverAccessToken(authorizationCode)
        await getNaverUserInfo()


    } else {
        await getKakaoToken(authorizationCode)
        const { nickname, profile_image, thumbnail_image } = await getKakaoUserInfo()
        updateProfile(nickname, profile_image)
    }
}