<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-copy">
        <span class="eyebrow">WELCOME BACK</span>
        <h1>Northstar 管理平台</h1>
        <p>把身份权限、组织人事和审计留痕收口到同一套运营中台。</p>
      </div>

      <el-card class="login-card" shadow="never">
        <h2>账号登录</h2>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="admin" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item v-if="captcha.required" label="验证码" prop="captchaCode">
            <div class="captcha-row">
              <el-input v-model="form.captchaCode" placeholder="计算结果" />
              <el-button @click="loadCaptcha">{{ captcha.question || '刷新' }}</el-button>
            </div>
          </el-form-item>
          <el-button type="primary" class="submit-btn" :loading="loading" native-type="submit">进入系统</el-button>
        </el-form>
        <p class="hint">演示账号 admin / Admin@123456，普通成员 member / Member@123456</p>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useSessionStore } from '@/stores/session'
import { ApiError } from '@/types/api'
import type { CaptchaPayload } from '@/types/models'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captcha = reactive<CaptchaPayload>({ captchaId: '', question: '', required: false })
const form = reactive({
  username: '',
  password: '',
  captchaCode: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function loadCaptcha() {
  const data = await authApi.captcha()
  captcha.captchaId = data.captchaId
  captcha.question = data.question
  captcha.required = true
}

function applyCaptcha(error: unknown) {
  const data =
    error instanceof ApiError
      ? error.data
      : error && typeof error === 'object' && 'data' in error
        ? (error as { data?: unknown }).data
        : undefined
  const payload =
    data && typeof data === 'object'
      ? (data as { captchaRequired?: boolean; captchaId?: string; question?: string })
      : null
  if (payload?.captchaRequired) {
    captcha.required = true
    captcha.captchaId = payload.captchaId ?? ''
    captcha.question = payload.question ?? ''
    return
  }
  captcha.required = false
  captcha.captchaId = ''
  captcha.question = ''
  form.captchaCode = ''
}

async function handleLogin() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    await formRef.value?.validate()
    const tokens = await session.login({
      username: form.username,
      password: form.password,
      captchaId: captcha.required ? captcha.captchaId : undefined,
      captchaCode: captcha.required ? form.captchaCode : undefined,
    })
    ElMessage.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.push(tokens.mustChangePassword ? '/profile' : redirect)
  } catch (error) {
    applyCaptcha(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  background:
    radial-gradient(circle at 12% 18%, rgba(79, 124, 255, 0.18), transparent 24%),
    linear-gradient(135deg, var(--color-bg), var(--color-surface-muted));
}
.login-container {
  max-width: 1080px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: center;
  margin: 0 auto;
}
.login-copy {
  max-width: 620px;
  color: var(--color-text-strong);
  h1 {
    margin: 0;
    font-size: clamp(42px, 7vw, 82px);
    line-height: 1.1;
  }
  p {
    margin: 18px 0 0;
    color: var(--color-text-muted);
    font-size: 18px;
  }
}
.login-card {
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface-glass);
  h2 {
    margin: 0 0 18px;
    color: var(--color-text-strong);
  }
}
.submit-btn {
  width: 100%;
  margin-top: 8px;
}
.hint {
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
}
.captcha-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  width: 100%;
}
@media (max-width: 900px) {
  .login-container {
    grid-template-columns: 1fr;
    padding: 24px;
  }
}
</style>
