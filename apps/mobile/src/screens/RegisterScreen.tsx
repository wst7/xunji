import { useRouter } from 'expo-router'

import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/AuthProvider'

export function RegisterScreen() {
  const router = useRouter()
  const { signUp } = useAuth()

  return (
    <AuthForm
      title="创建账号"
      submitLabel="注册"
      onSubmit={signUp}
      newPassword
      footerText="已经有账号？"
      footerLinkLabel="登录"
      onFooterPress={() => router.replace('/login')}
    />
  )
}
