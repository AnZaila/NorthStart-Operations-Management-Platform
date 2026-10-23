import { ElButton } from 'element-plus'
import { withDirectives, type App, type Directive, type VNode } from 'vue'
import VWave from 'v-wave'

interface PatchableButton {
  setup?: (this: unknown, props: object, ctx: object) => unknown
  __nsWave?: boolean
}

/**
 * 模板里的 el-button 由 unplugin 从 element-plus 按需引入，
 * 全局再注册同名组件盖不住这些引用，也盖不住 MessageBox 内部按钮。
 * 直接包一层 ElButton.setup，所有按钮实例都会带上 v-wave。
 */
export function installButtonWave(app: App) {
  const { vWave } = VWave.createLocalWaveDirective()
  app.directive('wave', vWave)

  const button = ElButton as unknown as PatchableButton
  if (button.__nsWave || typeof button.setup !== 'function') {
    return
  }
  const setup = button.setup
  button.setup = function (props, ctx) {
    const render = setup.call(this, props, ctx)
    if (typeof render !== 'function') {
      return render
    }
    return function (this: unknown, ...args: unknown[]) {
      const vnode = (render as (...a: unknown[]) => VNode).apply(this, args)
      return withDirectives(vnode, [[vWave as Directive]])
    }
  }
  button.__nsWave = true
}
