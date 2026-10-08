import axios from 'axios'
import { toast } from 'sonner'
import type {
    AccountResponse,
    AccountCreate,
    AccountUpdate,
    OAuthCodeExchange,
    SettingsRead,
    SettingsUpdate,
    StatisticsResponse,
} from './types'

const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add a request interceptor to attach the admin key
api.interceptors.request.use(config => {
    const adminKey = localStorage.getItem('adminKey')
    if (adminKey) {
        config.headers['X-API-Key'] = adminKey
    }
    return config
})

// Add a response interceptor to handle global errors
api.interceptors.response.use(
    response => response,
    error => {
        // Handle expired login
        if (error.response?.data?.detail?.code === 401011) {
            localStorage.removeItem('adminKey')
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
            return Promise.reject(error)
        }

        // Try to read detail.message from the error response
        const errorMessage = error.response?.data?.detail?.message || 'An unknown error occurred'

        toast.error(errorMessage)

        // Re-throw so components can handle the error further
        return Promise.reject(error)
    },
)

// Account-related API
export const accountsApi = {
    list: () => api.get<AccountResponse[]>('/api/admin/accounts'),
    get: (organizationUuid: string) => api.get<AccountResponse>(`/api/admin/accounts/${organizationUuid}`),
    create: (account: AccountCreate) => api.post<AccountResponse>('/api/admin/accounts', account),
    update: (organizationUuid: string, account: AccountUpdate) =>
        api.put<AccountResponse>(`/api/admin/accounts/${organizationUuid}`, account),
    delete: (organizationUuid: string) => api.delete(`/api/admin/accounts/${organizationUuid}`),
    exchangeOAuthCode: (exchangeData: OAuthCodeExchange) =>
        api.post<AccountResponse>('/api/admin/accounts/oauth/exchange', exchangeData),
}

// Settings-related API
export const settingsApi = {
    get: () => api.get<SettingsRead>('/api/admin/settings'),
    update: (settings: SettingsUpdate) => api.put<SettingsUpdate>('/api/admin/settings', settings),
}

// Health check
export const healthApi = {
    check: () => api.get('/health'),
}

// Statistics API
export const statisticsApi = {
    get: () => api.get<StatisticsResponse>('/api/admin/statistics'),
}
