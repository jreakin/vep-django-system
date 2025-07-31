import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../store'
import { initializeAuth, logout } from '../store/authSlice'
import authService from '../services/auth'

export const useAuthInitialization = () => {
  const dispatch = useDispatch()
  const { token, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // If we have a token but no user data, fetch the current user
    if (token && !user) {
      authService.getCurrentUser()
        .then((userData) => {
          dispatch(initializeAuth(userData))
        })
        .catch(() => {
          // Token is invalid, clear auth state
          dispatch(logout())
        })
    }
  }, [token, user, dispatch])
}