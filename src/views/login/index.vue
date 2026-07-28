<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AmbientBackground from '@/components/background/AmbientBackground.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTag from '@/components/ui/AppTag.vue'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { useUserStore } from '@/stores/user'
import { ROLE_META, type RoleKey } from '@/types/permission'
import { toast } from '@/utils/toast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { y: 18, stagger: 0.08 })

const DEMO_ACCOUNT: Record<RoleKey, string> = {
  super_admin: 'admin',
  admin: 'manager',
  operator: 'operator',
}

const role = ref<RoleKey>('super_admin')
const username = ref(DEMO_ACCOUNT.super_admin)
const password = ref('nebula123')
const loading = ref(false)
const errorText = ref('')

const redirect = computed(() => (route.query.redirect as string | undefined) ?? '/dashboard')

function pickRole(next: RoleKey): void {
  role.value = next
  username.value = DEMO_ACCOUNT[next]
  errorText.value = ''
}

async function submit(): Promise<void> {
  if (!username.value || !password.value) {
    errorText.value = '请输入账号与密码'
    return
  }
  loading.value = true
  errorText.value = ''
  try {
    const profile = await userStore.login({
      username: username.value,
      password: password.value,
      role: role.value,
    })
    await router.replace(redirect.value)
    toast.success(`欢迎回来，${profile.nickname}`, `当前角色：${ROLE_META[role.value].name}`)
  } catch (error) {
    errorText.value = (error as Error).message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex h-full w-full items-center justify-center overflow-hidden p-4">
    <AmbientBackground />

    <div ref="rootRef" class="grid w-full max-w-[980px] gap-6 lg:grid-cols-2 lg:gap-10">
      <!-- 左侧品牌区：窄屏隐藏，避免挤压表单 -->
      <section class="hidden flex-col justify-center lg:flex" data-motion>
        <div class="flex items-center gap-3">
          <span class="relative flex-center size-11">
            <span class="login-ring" />
            <span
              class="relative size-3 rounded-full bg-[linear-gradient(140deg,rgb(var(--c-brand)),rgb(var(--c-violet)))] shadow-[0_0_16px_rgb(var(--c-brand))]"
            />
          </span>
          <div>
            <p class="text-[19px] font-semibold tracking-[0.3em]">NEBULA</p>
            <p class="text-[11px] tracking-[0.18em] text-text-dim">DATA CONTROL PLATFORM</p>
          </div>
        </div>

        <h2 class="mt-8 text-[30px] font-semibold leading-tight tracking-tight">
          让每一次决策
          <br />
          <span class="text-gradient">都有数据支撑</span>
        </h2>
        <p class="mt-3 max-w-96 text-[13px] leading-relaxed text-text-soft">
          统一的指标口径、秒级的实时链路、细到按钮的权限控制。
          这是一套面向数据中台的后台管理系统骨架。
        </p>

        <ul class="mt-7 space-y-2.5">
          <li
            v-for="item in [
              { icon: 'i-lucide-gauge', text: '实时指标与趋势分析' },
              { icon: 'i-lucide-shield-check', text: '菜单 / 页面 / 按钮三层权限' },
              { icon: 'i-lucide-layers', text: '多标签页与页面级缓存' },
            ]"
            :key="item.text"
            class="flex items-center gap-2.5 text-[12.5px] text-text-soft"
          >
            <span class="flex-center size-7 rounded-lg bg-brand/10 text-brand ring-1 ring-brand/20">
              <i :class="item.icon" />
            </span>
            {{ item.text }}
          </li>
        </ul>
      </section>

      <!-- 右侧表单 -->
      <section class="panel edge-light relative overflow-hidden p-6 sm:p-7" data-motion>
        <div
          class="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-violet/12 blur-2xl"
        />

        <div class="relative">
          <h1 class="text-[20px] font-semibold tracking-tight">登录控制台</h1>
          <p class="mt-1 text-[12.5px] text-text-dim">
            演示环境：任选一个角色，密码任意（不少于 6 位）
          </p>

          <!-- 角色速选：直接体现权限系统的存在 -->
          <div class="mt-5 grid grid-cols-3 gap-2">
            <button
              v-for="meta in Object.values(ROLE_META)"
              :key="meta.key"
              type="button"
              class="rounded-xl border p-2.5 text-left transition-all duration-300"
              :class="
                role === meta.key
                  ? 'border-brand/50 bg-brand/10 shadow-[0_8px_24px_-14px_rgb(var(--c-brand)/0.8)]'
                  : 'border-line/60 hover:-translate-y-0.5 hover:border-brand/30'
              "
              @click="pickRole(meta.key)"
            >
              <i
                :class="[
                  meta.key === 'super_admin'
                    ? 'i-lucide-crown'
                    : meta.key === 'admin'
                      ? 'i-lucide-shield-check'
                      : 'i-lucide-line-chart',
                  'text-[16px]',
                  role === meta.key ? 'text-brand' : 'text-text-dim',
                ]"
              />
              <p class="mt-1 truncate text-[11.5px] font-medium">{{ meta.name }}</p>
            </button>
          </div>

          <form class="mt-5 space-y-3.5" @submit.prevent="submit">
            <label class="block space-y-1.5">
              <span class="text-[12px] text-text-soft">账号</span>
              <AppInput v-model="username" icon="i-lucide-at-sign" placeholder="请输入账号" />
            </label>
            <label class="block space-y-1.5">
              <span class="text-[12px] text-text-soft">密码</span>
              <AppInput
                v-model="password"
                type="password"
                icon="i-lucide-lock-keyhole"
                placeholder="请输入密码"
                @enter="submit"
              />
            </label>

            <Transition name="fade-slide">
              <p
                v-if="errorText"
                class="flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-2 text-[11.5px] text-danger"
              >
                <i class="i-lucide-circle-alert shrink-0" />{{ errorText }}
              </p>
            </Transition>

            <AppButton
              variant="primary"
              size="lg"
              block
              type="submit"
              :loading="loading"
              icon-right="i-lucide-arrow-right"
            >
              进入控制台
            </AppButton>
          </form>

          <div class="mt-4 flex items-center justify-between text-[11px] text-text-dim">
            <AppTag tone="brand" size="xs" icon="i-lucide-shield">Mock 环境</AppTag>
            <span>当前角色：{{ ROLE_META[role].name }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: rgb(var(--c-brand) / 0.9);
  border-left-color: rgb(var(--c-violet) / 0.6);
  animation: spin-slow 6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .login-ring {
    animation: none;
  }
}
</style>
