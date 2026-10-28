import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../api/client'
import { AuthForm } from '../components/AuthForm'

export default function Register() {
  const navigate = useNavigate()

  if (getToken()) return <Navigate to="/" replace />

  async function handleRegister(email: string, password: string) {
    const res = await api.register(email, password)
    setToken(res.token)
    navigate('/', { replace: true })
  }

  return (
    <AuthForm
      title="创建账户"
      submitLabel="注册"
      newPassword
      onSubmit={handleRegister}
      footer={
        <>
          已有账号？<Link to="/login">登录</Link>
        </>
      }
    />
  )
}
