

const kakaoLoginButton = document.querySelector("#kakao-login-button")
const naverLoginButton = document.querySelector("#naver-login-button")

const profileImage = document.querySelector("#profile-image")
const userName = document.querySelector("#user-name")
const logoutButton = document.querySelector("#logout-button")

const redirectUri = "http://localhost:5500"
let kakaoClientId = null
let kakaoAccessToken = null
axios.defaults.baseURL = "http://localhost:3000"
axios.defaults.headers.common["Content-Type"] = "text/plain"

const checkThenGetApiKey = async () => {
    if (kakaoClientId) { return }
    const response = await axios.get("/kakao/client-id")
    if (!response || !response.data) { console.error("---- ERROR OCCURRED: Fail to get api key") }
    kakaoClientId = response.data
}

kakaoLoginButton.addEventListener("click", async () => {
    await checkThenGetApiKey()
    location.href = `https://kauth.kakao.com/oauth/authorize/?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code`
})


const getKakaoToken = async (authorizationCode) => {
    const accessTokenResponse = await axios.post("/kakao/code-to-token", authorizationCode)
    kakaoAccessToken = accessTokenResponse.data
}

const getKakaoUserInfo = async (accessToken) => {
    const response = await axios.post("/kakao/user-info", accessToken)
    const { nickname, profile_image, thumbnail_image } = response.data
    return { nickname, profile_image, thumbnail_image }
}

const updateProfile = (nickname, profile_image) => {
    userName.innerText = nickname
    profileImage.src = profile_image
}

window.onload = async () => {
    const searchParams = new URLSearchParams(window.location.search)

    const authorizationCode = searchParams.get("code")
    if (!authorizationCode) {
        console.error("---- got no code from kakao even after redirect")
        return
    }
    await getKakaoToken(authorizationCode)
    const { nickname, profile_image, thumbnail_image } = await getKakaoUserInfo(kakaoAccessToken)
    updateProfile(nickname, profile_image)
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

logoutButton.addEventListener("click", async () => {
    await kakaoLogout()
})