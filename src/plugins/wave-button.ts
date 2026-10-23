import { ElButton, ElMenuItem, ElOption, ElSubMenu } from 'element-plus'
import { isVNode, withDirectives, type App, type Directive, type VNode } from 'vue'
import VWave from 'v-wave'

interface Patchable {
  setup?: (this: unknown, props: object, ctx: object) => unknown
  __nsWave?: boolean
}

const TITLE_CLASS = 'el-sub-menu__title'

type TitleSlot = () => VNode | VNode[] | null | undefined

function patchSetup(component: unknown, decorate: (vnode: VNode, props: object) => VNode) {
  const target = component as Patchable
  if (target.__nsWave || typeof target.setup !== 'function') {
    return
  }
  const setup = target.setup
  target.setup = function (props, ctx) {
    const render = setup.call(this, props, ctx)
    if (typeof render !== 'function') {
      return render
    }
    return function (this: unknown, ...args: unknown[]) {
      const vnode = (render as (...a: unknown[]) => VNode).apply(this, args)
      return decorate(vnode, props)
    }
  }
  target.__nsWave = true
}

function disabledOf(props: object) {
  return { disabled: Boolean((props as { disabled?: boolean }).disabled) }
}

/** 选项这类组件的 setup 返回的是状态，真正的根节点在 render 里。 */
function patchRender(component: unknown, decorate: (vnode: VNode, props: object) => VNode) {
  const target = component as {
    render?: (this: unknown, ...args: unknown[]) => VNode
    __nsWave?: boolean
  }
  if (target.__nsWave || typeof target.render !== 'function') {
    return
  }
  const render = target.render
  target.render = function (this: unknown, ...args: unknown[]) {
    const vnode = render.apply(this, args)
    const props = args[2]
    return decorate(vnode, props && typeof props === 'object' ? props : {})
  }
  target.__nsWave = true
}

function isSubmenuTitle(vnode: VNode) {
  const className = vnode.props?.class
  if (typeof className === 'string') {
    return className.split(/\s+/).includes(TITLE_CLASS)
  }
  return Array.isArray(className) && className.includes(TITLE_CLASS)
}

function childVNodes(vnode: VNode) {
  return Array.isArray(vnode.children) ? vnode.children.filter(isVNode) : []
}

/** 展开态标题是 li 下的普通节点，折叠态标题在 Tooltip 的 default 插槽里。 */
function attachTitleWave(root: VNode, directive: Directive, disabled: boolean) {
  const branch = childVNodes(root)[0]
  if (!branch) {
    return
  }
  if (Array.isArray(branch.children)) {
    const index = branch.children.findIndex((child) => isVNode(child) && isSubmenuTitle(child))
    const title = branch.children[index]
    if (isVNode(title)) {
      branch.children[index] = withDirectives(title, [[directive, { disabled }]])
    }
    return
  }
  const slots = branch.children
  if (!slots || Array.isArray(slots) || typeof slots !== 'object') {
    return
  }
  const renderTitle = slots.default
  if (typeof renderTitle !== 'function') {
    return
  }
  const render = renderTitle as TitleSlot
  slots.default = () => {
    const title = render()
    return isVNode(title) && isSubmenuTitle(title) ? withDirectives(title, [[directive, { disabled }]]) : title
  }
}

/**
 * 模板里的组件由 unplugin 从 element-plus 按需引入，全局注册盖不住。
 * 包一层渲染：按钮、菜单项、下拉选项的根节点，以及子菜单标题带上 v-wave。
 * 子菜单波纹只挂在标题上，避免点开下级时整块菜单一起扩散。
 */
export function installButtonWave(app: App) {
  const { vWave } = VWave.createLocalWaveDirective()
  const directive = vWave as Directive
  app.directive('wave', directive)

  patchSetup(ElButton, (vnode) => withDirectives(vnode, [[directive]]))
  patchSetup(ElMenuItem, (vnode, props) => withDirectives(vnode, [[directive, disabledOf(props)]]))
  patchSetup(ElSubMenu, (vnode, props) => {
    attachTitleWave(vnode, directive, disabledOf(props).disabled)
    return vnode
  })
  patchRender(ElOption, (vnode, props) => withDirectives(vnode, [[directive, disabledOf(props)]]))
}
