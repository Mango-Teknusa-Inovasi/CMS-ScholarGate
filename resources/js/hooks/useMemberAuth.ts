import { useCallback, useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import {
  type AuthUser,
  fetchMemberMe,
  memberLogin as doLogin,
  memberLogout as doLogout,
} from '../lib/auth'

type SharedAuth = {
  auth?: { user: AuthUser | null }
}

export function useMemberAuth() {
  const page = usePage<SharedAuth>()
  const shared = page.props.auth?.user ?? null
  const [user, setUser] = useState<AuthUser | null>(shared)
  const [loading, setLoading] = useState(!shared)

  const refresh = useCallback(async () => {
    setLoading(true)
    const me = await fetchMemberMe()
    setUser(me)
    setLoading(false)
    return me
  }, [])

  useEffect(() => {
    if (shared) {
      setUser(shared)
      setLoading(false)
      return
    }
    void refresh()
  }, [shared, refresh])

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
