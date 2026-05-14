import axios from 'axios'

export const TOKEN_KEY = 'daodao_admin_token'

function attachInterceptors(client: ReturnType<typeof axios.create>) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem(TOKEN_KEY)
        if (!window.location.pathname.endsWith('/login')) {
          window.location.href = `${import.meta.env.BASE_URL}login`
        }
      }
      return Promise.reject(err)
    },
  )
}

const apiClient = axios.create({ baseURL: '/', timeout: 30000, withCredentials: true })
attachInterceptors(apiClient)

// Playground / LLM calls can take up to 2 minutes
export const slowApiClient = axios.create({ baseURL: '/', timeout: 120000, withCredentials: true })
attachInterceptors(slowApiClient)

export default apiClient
