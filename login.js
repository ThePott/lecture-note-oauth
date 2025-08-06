const kakaoLoginButton = document.querySelector("#kakao-login-button")
const naverLoginButton = document.querySelector("#naver-login-button")

const profileImage = document.querySelector("#profile-image")
const userName = document.querySelector("#user-name")
const logoutButton = document.querySelector("#logout-button")

const redirectUri = "http://localhost:5500"
let kakaoClientId = null
let kakaoAccessToken = null
let naverClientId = null
let naverAccessToken = null
let naverState = null
let currentlyLoggedInWith = null

axios.defaults.baseURL = "http://localhost:3000"
axios.defaults.headers.common["Content-Type"] = "text/plain"

const updateProfile = (nickname, profile_image) => {
    userName.innerText = nickname
    profileImage.src = profile_image
}

/** KAKAO env */
const updateKakaoEnv = async () => {
    if (kakaoClientId) { return }
    const response = await axios.get("/kakao/env")
    if (!response || !response.data) { console.error("---- ERROR OCCURRED: Fail to get api key") }
    kakaoClientId = response.data
}

/** KAKAO env -> auth code */
kakaoLoginButton.addEventListener("click", async () => {
    await updateKakaoEnv()
    location.href = `https://kauth.kakao.com/oauth/authorize/?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code`
})

/** KAKAO code -> token */
const updateKakaoAccessToken = async (authorizationCode) => {
    const accessTokenResponse = await axios.post("/kakao/code-to-token", authorizationCode)
    kakaoAccessToken = accessTokenResponse.data
}

/** token -> user info */
const getKakaoUserInfo = async () => {
    const response = await axios.post("/kakao/user-info", kakaoAccessToken)
    const { nickname, profile_image, thumbnail_image } = response.data
    return { nickname, profile_image, thumbnail_image }
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

/** NAVER env */
const updateNaverEnv = async () => {
    if (naverClientId) { return }

    // env variable 가져오기
    const response = await axios.get("/naver/env")
    naverState = response.data.naverState
    naverClientId = response.data.naverClientId
}

/** NAVER env -> auth code */
naverLoginButton.addEventListener("click", async () => {
    await updateNaverEnv()

    // auth code 받기
    location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}&response_type=code&redirect_uri=${redirectUri}&state=${naverState}`
})

/** NAVER code -> token */
const updateNaverAccessToken = async (authorizationCode) => {
    const response = await axios.post("/naver/code-to-token", authorizationCode)
    const { access_token } = response.data
    naverAccessToken = access_token
}

/** NAVER token -> user info */
const getNaverUserInfo = async () => {
    const response = await axios.get(
        "/naver/user-info",
        { headers: { "Authorization": `Bearer ${naverAccessToken}` } }
    )
    const { name, profile_image } = response.data

    updateProfile(name, profile_image)
}

const naverLogout = async () => {
    if (!naverAccessToken) {
        console.error("---- ERROR: No access token")
        debugger
        return
    }
    const _response = await axios.post("/naver/logout", undefined, { headers: { "Authorization": `Bearer ${kakaoAccessToken}` } })
    updateProfile("", "")
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
        await updateNaverAccessToken(authorizationCode)
        await getNaverUserInfo()
        currentlyLoggedInWith = "naver"

    } else {
        await updateKakaoAccessToken(authorizationCode)
        const { nickname, profile_image, thumbnail_image } = await getKakaoUserInfo()
        updateProfile(nickname, profile_image)
        currentlyLoggedInWith = "kakao"
    }
}

logoutButton.addEventListener("click", async () => {
    if (!currentlyLoggedInWith) {
        console.error("---- ERROR OCCURRED: what did you login with?")
        return
    }

    switch (currentlyLoggedInWith) {
        case "kakao":
            await kakaoLogout()
            return
        case "naver":
            await naverLogout()
            return
        default:
            console.error("---- ERROR OCCURRED: invalid login method")
            return
    }

})