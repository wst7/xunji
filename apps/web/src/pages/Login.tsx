import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../api/client'
import { AuthForm } from '../components/AuthForm'

export default function Login() {
  const navigate = useNavigate()

  if (getToken()) return <Navigate to="/" replace />

  async function handleLogin(email: string, password: string) {
    const res = await api.login(email, password)
    setToken(res.token)
    navigate('/', { replace: true })
  }

  return (
    <AuthForm
      title="欢迎回来"
      submitLabel="登录"
      onSubmit={handleLogin}
      footer={
        <>
          还没有账号？<Link to="/register">注册</Link>
        </>
      }
    />
  )
}
