import { store } from '@/store'
import router from './router'
import { AppRouteRecordRaw } from './common/types/appRoute.type'
import { PermissionActionContants } from './store/modules/permission'
import { getToken } from './utils/storage'
import { UserActionContants } from './store/modules/user'

const whiteList = ['/login', '/pdf/']

router.beforeEach(async (to, from, next) => {
  const toMetaTitle = to.meta?.title || ''
  document.title = `${toMetaTitle ? `${toMetaTitle}-` : ''}Nest Admin`
  const hasToken = getToken()
  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else if (!store.state.permission.isReqPerm) {
      store.dispatch(UserActionContants.GET_USER_INFO, true)
      const menuPerms = await store.dispatch(UserActionContants.GET_USER_MENU_PERM)
      const accessRoutes: Array<AppRouteRecordRaw> = await store.dispatch(
        PermissionActionContants.GENRATERROUTES,
        menuPerms,
      )
      accessRoutes.forEach((route) => router.addRoute(route))
      next({ ...to, replace: true })
    } else next()
  } else if (whiteList.some((one) => to.path.includes(one))) {
    next()
  } else {
    next(`/login${['', '/'].includes(to.path) ? '' : `?redirect=${to.path}`}`)
  }
})
