import { useCallback, useEffect, useState } from 'react'
import {
  type AuthUser,
  fetchMemberMe,
  getMemberToken,
  memberLogin as doLogin,
  memberLogout as doLogout,
} from '../lib/auth'

export function useMemberAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(!!getMemberToken())

  const refresh = useCallback(async () => {
    if (!getMemberToken()) {
      setUser(null)
      setLoading(false)
      return null
    }
    setLoading(true)
    const me = await fetchMemberMe()
    setUser(me)
    setLoading(false)
    return me
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const data = await doLogin(email, password)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    await doLogout()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    logout,
    refresh,
  }
}
