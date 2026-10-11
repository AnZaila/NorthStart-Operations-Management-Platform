<template>
  <div class="learning-page">
    <h1>{{ pageTitle }}</h1>
    <h2 class="mouse-xy">e.clientX: {{ x }} e.clientY: {{ y }}</h2>
    <el-button type="primary" @click="alertTitle">check</el-button>
    <h2>-- ref and reactive</h2>
    <div class="form-area-box">
      <div class="form-item">
        <input type="text" v-model="userInfo.username" v-on:change="isShowUserInfo" />
        <span v-if="isShowUserInfo().showUserName">username: {{ userInfo.username }}</span>
      </div>
      <div class="form-item">
        <input type="password" v-model="userInfo.password" v-on:change="isShowUserInfo" />
        <span v-if="isShowUserInfo().showPassWord">password: {{ userInfo.password }}</span>
      </div>
      <div class="form-item">
        <input type="number" v-model="userInfo.age" v-on:change="isShowUserInfo" />
        <span v-if="isShowUserInfo().showAge">password: {{ userInfo.age }}</span>
      </div>
      <el-button type="primary" plain>Login</el-button>
    </div>
    <hr />
    <el-divider />
    <h2>-- toRefs and toRef</h2>
    <div class="common-container">
      <p>This is a toRefs example.</p>
      <div>
        <span>username: </span>
        <span>{{ username }}</span>
      </div>
      <div>
        <span>password: </span>
        <span>{{ password }}</span>
      </div>
      <div>
        <span>age: </span>
        <span>{{ age }}</span>
      </div>
    </div>
    <h2>-- computed</h2>
    <p>{{ userMenus }}</p>
    <hr />
    <h2>-- watch</h2>
    <input type="number" v-model="watchNum" />
    <p>watchNumNewVal now is: {{ watchNumNewVal }}</p>
    <p>watchNumOldVa now is: {{ watchNumOldVal }}</p>
    <p>Current num: {{ watchNum }}</p>
    <p>Current num plus 10 is: {{}}</p>
    <p class="strong-p">-- For ref define Object data：</p>
    <p>person.name: {{ person.name }}</p>
    <p>nowName: {{ nowName }}</p>
    <el-button type="primary" @click="changePersonName">click here to change person.name</el-button>
    <p>person.age: {{ person.age }}</p>
    <p>nowAge: {{ nowAge }}</p>
    <el-button type="primary" @click="changePersonAge">click here to change person.age</el-button>
    <p class="strong-p">-- For reactive define Object data：</p>
    <p>person2.name: {{ person2.name }}</p>
    <p>nowName2: {{ nowName2 }}</p>
    <el-button type="primary" @click="changePerson2Name"
      >click here to change person2.name</el-button
    >
    <p>person2.age: {{ person2.age }}</p>
    <p>nowAge2: {{ nowAge2 }}</p>
    <el-button type="primary" @click="changePerson2Age">click here to change person2.age</el-button>
    <hr />
    <h2>-- Tag's "ref" attribute</h2>
    <p ref="refP">我的内容是什么?</p>
    <el-button type="primary" plain @click="alerRefp">alert refP's content</el-button>
    <span ref="refSpan">我是span</span>
    <el-button type="primary" plain @click="alerRefSpan">alert refSpan's content</el-button>
    <MyChild1 ref="myChild1" :menu-list="userMenuList" />
    <el-button type="primary" plain @click="alertMyChild1">
      click to alert myChild1 definExpose atrribute
    </el-button>
    <el-button type="primary" plain @click="changeMyChild1Name">
      click to change myChild1 name
    </el-button>
    <el-divider />
    <MyChild2 @send-data="receiveData" />
    <el-divider />
    <MyChild3 ref="child3Ref" />
    <el-button type="primary" plain @click="changeChild3Name"
      >click me to excute child3's method.</el-button
    >
    <el-divider />
    <MyChild4 v-model:color="color" v-model:height="height" />
    <el-divider />
    <span>dialogMsg: {{ dialogMsg }}</span>
    <el-button type="primary" plain @click="openShowInfoDialog">展示</el-button>
    <el-button type="primary" plain @click="openCreateInfoDialog">新增</el-button>
    <InfoDialog
      v-model:visible="infoDialogVisible"
      :mode="infoDialogMode"
      v-model:msg="dialogMsg"
      :user="userInfo"
      @submit="handleCreateInfo"
      @change:msg="changeMsg"
    />
    <el-divider />
    <p>usera.name: {{ editData?.name }}</p>
    <p>usera.age: {{ editData?.age }}</p>
    <p>showMsg: {{ showMsg }}</p>
    <el-button type="primary" @click="openEdit">打开编辑弹窗</el-button>
    <UserEditDialog
      v-model:visible="dialogVisible"
      :edit-user="editData"
      :message="showMsg"
      @update:message="changeShowMsg"
      @submit="onSubmit"
      @closed="onClosed"
    />
    <el-divider></el-divider>
    <UserDescription title="用户信息" :userData="showUserData" />
    <el-divider></el-divider>
    <DialogTest1 v-model="DialogTest1Visible" :data="testData1" />
    <el-button type="primary" plain @click="checkDialogTest1">查看</el-button>
    <el-divider/>
    <el-button type="primary" @click="openMyChild5">打开MyChild5</el-button>
    <MyChild5 v-model="Mychild5Visile" :userData="showUserData"/>
  </div>
</template>
<script setup lang="ts">
import {
  ref,
  reactive,
  toRefs,
  toRef,
  computed,
  watch,
  watchEffect,
  useTemplateRef,
  provide,
} from 'vue'
import MyChild1 from './components/MyChild1.vue'
import MyChild2 from './components/MyChild2.vue'
import MyChild3 from './components/MyChild3.vue'
import MyChild4 from './components/MyChild4.vue'
import InfoDialog from './components/InfoDialog.vue'
import UserEditDialog from './components/UserEditDialog.vue'
import UserDescription from './components/UserDescription.vue'
// Hooks
import { useMouse } from '@/Hooks/useMouse'
import { ElMessage } from 'element-plus'
import { userDataShowType, type InfoDialogMode, type UserInfo } from '@/types/learning'
import type { User } from '@/types/learning.ts'
import type { DepartmentRecord } from '@/types/organization.ts'
import DialogTest1 from './components/DialogTest1.vue'
import MyChild5 from './components/MyChild5.vue'
import { tr } from 'element-plus/es/locales.mjs'
// 1、ref
const pageTitle = ref('This is a Vue3 learning page.')
// hooks
const { x, y } = useMouse()
// 使用ref的值，后面需要写一个value
const alertTitle = () => {
  alert(pageTitle.value)
}
// 2、reactive
const userInfo = reactive<UserInfo>({
  username: 'Anzai',
  password: '123456',
  age: null,
})

const isShowUserInfo = () => {
  const showUserName = userInfo.username
  const showPassWord = userInfo.password
  const showAge = userInfo.age
  return {
    showUserName,
    showPassWord,
    showAge,
  }
}
// 3、toRefs and to ref
// 直接解构出来，就失去了响应式
// const { username, password } = userInfo
// 此时就应该使用toRefs 和 toRef
const { username, password } = toRefs(userInfo)
const age = toRef(userInfo, 'age')

// 4、computed 计算属性
// 只读取
const demoPermissions = ['dashboard:view', 'system:user:view', 'system:role:view']
const userMenus = computed(() => demoPermissions)
// 可读可写
const firstName = ref('张')
const lastName = ref('三')
const fullName = computed({
  get() {
    // 读取 fullName 的时候执行
    return firstName.value + '-' + lastName.value
  },
  set(newName) {
    // 当 fullName.value = '李-四' 触发set
    const [first = '', last = ''] = newName.split('-')
    firstName.value = first
    lastName.value = last
  },
})
// 读：触发get
console.log(fullName.value) // 张-三

// 写：触发set，内部修改原始ref
fullName.value = '李-四'
console.log(firstName.value) // 李
console.log(lastName.value) // 四

// 5、watch
// 情况一：基础数据类型
const watchNum = ref(null)
const watchNumNewVal = ref()
const watchNumOldVal = ref()
const watchFn = watch(watchNum, (newVal, oldVal) => {
  watchNumNewVal.value = newVal
  watchNumOldVal.value = oldVal
  // 满足某个条件是，终止自己
  if (watchNum.value === 12) {
    // 执行即为停止watch
    watchFn()
  }
})
// 情况二：ref定义的对象数据类型
const person = ref({ name: 'Anzai', age: 22 })
const nowName = ref('')
const nowAge = ref()
const changePersonName = () => {
  person.value.name += '6'
}
const changePersonAge = () => {
  person.value.age -= 1
}
const personWatch = watch(
  person,
  (newVal, oldVal) => {
    nowName.value = newVal.name
    nowAge.value = newVal.age
    console.log('personOldVal：', oldVal)
    if (newVal.age <= 18) {
      personWatch()
    }
  },
  { deep: true },
)
// 情况三：reactive 定义的对象数据类型
// reactive定义的【对象类型】数据，默认开启了深度监视,且无法关闭！
const person2 = reactive({
  name: 'Anzai2',
  age: 18,
})
const nowName2 = ref('')
const nowAge2 = ref()
const changePerson2Name = () => {
  person2.name += '6'
}
const changePerson2Age = () => {
  person2.age -= 1
}
watch(person2, (newVal, oldVal) => {
  nowName2.value = newVal.name
  nowAge2.value = newVal.age
  console.log('person2OldVal：', oldVal)
})
// watch 监听多个值
const a = ref(1)
const b = ref(2)
// 监听 [a,b]
watch([a, b], (newArr, oldArr) => {
  // newArr: [a新值, b新值]
  // oldArr: [a旧值, b旧值]
  const [newA, newB] = newArr
  const [oldA, oldB] = oldArr
  console.log('a或b变了', newA, newB)
  console.log('原来的a、b', oldA, oldB)
})
// 6、watchEffect 对比watch 无需显式指定监听的对象、拿不到旧值
const stopWatchName = watchEffect(() => {
  console.log('watchEffect: person.value.name', person.value.name)
  if (person.value.name === 'Anzai66666666') {
    alert('你太6了，必须中断')
    stopWatchName()
  }
})

// 7、标签的ref属性
// vue3.x 通用
const refP = ref<HTMLElement | null>(null)
function alerRefp() {
  alert(refP.value?.innerHTML)
}
// Vue3.5+ 支持自定义变量名
const mySpan = useTemplateRef('refSpan')
function alerRefSpan() {
  alert(mySpan.value?.innerHTML)
}
// 获取组件实例
const myChild1 = ref<InstanceType<typeof MyChild1> | null>(null)
const alertMyChild1 = () => {
  alert(myChild1.value?.myName)
}
const changeMyChild1Name = () => {
  myChild1.value?.changeMyName()
}

// 8、props
// 情况一：父组件传递数据给子组件，子组件通过props接收
const userMenuList = demoPermissions
// 情况二：父组件传递数据给子组件，子组件通过props接收，并通过emit向父组件传递数据
const receiveData = (data: string, age: number) => {
  alert(`父组件接收到子组件传递过来的数据了: ${data}, age: ${age}`)
}
// 情况三： expose / defineExpose（父获取子组件实例/数据方法）
const child3Ref = ref<InstanceType<typeof MyChild3> | null>(null)
const changeChild3Name = () => {
  child3Ref.value?.changeMyName()
}
// 情况四：v-model 父子双向绑定 Vue3 支持单个/多个 v-model，本质是 props + emit
const color = ref('red')
const height = ref(100)
// 情况五： provide、project（父组件提供数据，子组件注入数据）
// 提供数据
// 直接 provide 普通值，不会响应式更新
provide('userInfo', userInfo)
// 使用ref、reactive、computed提供响应式数据
const themeColor = ref('blue')
provide('themeColor', themeColor) // 祖孙组件通信
// 提供方法
provide('changeThemeColor', (newColor: string) => {
  themeColor.value = newColor
})
// 情况六：事件总线（mitt 替代 Vue2 EventBus）
// 看MyChild4 和 MyChild3

// 情况七：$atrrs 透传 $attrs 包含了父组件传递给子组件的所有属性（除了子组件用 props 声明接收的）
// 情况八：$parent / $children 组件实例访问 耦合度极高、层级变动会失效、TS 兼容性差，不推荐生产使用，仅适合临时调试。

const infoDialogMode = ref<InfoDialogMode>('create')
const infoDialogVisible = ref<true | false>(false)
const dialogMsg = ref<string>('父子组件共享信息')

const openCreateInfoDialog = () => {
  infoDialogMode.value = 'create'
  infoDialogVisible.value = true
}

const openShowInfoDialog = () => {
  infoDialogMode.value = 'show'
  infoDialogVisible.value = true
}

const handleCreateInfo = (form: UserInfo) => {
  Object.assign(userInfo, form)
  infoDialogVisible.value = false
  ElMessage.success('新增信息已写入当前 userInfo')
}

const changeMsg = (value: string) => {
  dialogMsg.value = value
}

// 练习
const dialogVisible = ref(false)
const editData = ref<User | null>(null)
const showMsg = ref<string>('你好')
function openEdit() {
  editData.value = editData.value ? editData.value : { id: 1, name: '张三', age: 22 }
  dialogVisible.value = true
}

function onSubmit(user: User) {
  console.log('父拿到提交的数据', user)
  editData.value = user
}

const changeShowMsg = (value: string) => {
  showMsg.value = value
  console.log('这里还要做额外操作, 所以我用 :message + @update:message 的方式')
  console.log('如果只是单纯改变值，不做任何操作，那么就直接用 v-model:message 即可')
}

function onClosed() {
  console.log('弹窗完全关闭')
}

// 假设我拿到的数据为
const userData: DepartmentRecord = {
  id: 2001,
  name: '产品部',
  manager: '林知远',
  phone: '138-0000-2001',
  memberCount: 18,
  parent: 'headquarters',
  status: 'active',
  createdAt: '2025-10-18 09:10',
  note: '',
}

// const showUserData = ():Record<string, string>[] => {
//   return JSON.stringify(userData)
//     .split(',')
//     .reduce((acc, item) => {
//       const keyValue = item.split(':')
//       const key = keyValue[0]
//       const value = keyValue[1]
//       const final: Record<string, string> = {
//         label: key,
//         value,
//       }
//       acc.push(final)
//       return acc
//     }, [])
// }

const showUserData = computed(() => {
  const keys = Object.keys(userData)
  const showData: Record<string, string | number>[] = []
  for (const item of userDataShowType) {
    const fieldKey = item.value as keyof DepartmentRecord
    if (keys.includes(item.value as string)) {
      showData.push({
        label: item.label as string,
        // `??` 空值合并运算符：**只有 `null`、`undefined` 的时候才返回后面的`'-'`**
        value: userData[fieldKey] ?? '-',
      })
    }
  }
  return showData
})

// DialogTest1Visible
const DialogTest1Visible = ref<true | false>(false)
const testData1 = ref<Record<string, string>[]>([
  {
    label: '姓名',
    value: 'Anzai',
  },
  {
    label: '年龄',
    value: '18',
  },
  {
    label: '身高',
    value: '180',
  },
  {
    label: '体重',
    value: '130斤',
  },
])

const checkDialogTest1 = () => {
  DialogTest1Visible.value = true
}

// MyChild5
const Mychild5Visile = ref(false);

const openMyChild5 = () => {
  Mychild5Visile.value = true;
}
</script>

<style scoped lang="scss">
.learning-page {
  background: var(--el-bg-color);
  padding: 24px;
  border-radius: 8px;
}
.mouse-xy {
  position: sticky;
  top: -40px;
  background-color: var(--el-bg-color);
  margin: 0;
  padding: 20px 0;
  border-bottom: 1px solid var(--el-border-color);
}
.form-area-box {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .form-item {
    width: 100%;
    display: flex;
    gap: 12px;
    input {
      width: 100%;
      outline: none;
      border: 2px solid var(--el-border-color);
      padding: 6px 12px;
      border-radius: 4px;
      transition: all 0.2s;
      &:focus {
        border-color: var(--el-color-primary);
      }
    }
    span {
      white-space: nowrap;
      padding: 3px 12px;
      border: 1px solid var(--el-border-color);
    }
  }
}
.strong-p {
  font-weight: bold;
}
</style>
