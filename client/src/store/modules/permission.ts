import {
  MutationTree,
  ActionContext,
  ActionTree,
  CommitOptions,
  DispatchOptions,
  Store as VuexStore,
  Module,
} from 'vuex'
import { AppRouteRecordRaw } from '@/common/types/appRoute.type'
import { asyncRoutes, constantRoutes } from '@/router/index'
import { MenuApiResult } from '@/api/menu'
import { RootState } from '../index'

export enum PermissionMutationContants {
  SET_ROUTES = 'PERMISSION/SET_ROUTES',
}

export enum PermissionActionContants {
  GENRATERROUTES = 'permission/generaterRoutes',
}

export type PermissionState = {
  routes: AppRouteRecordRaw[]
  addRoutes: AppRouteRecordRaw[]
  isReqPerm: boolean
}

const state: PermissionState = {
  routes: [],
  addRoutes: [],
  isReqPerm: false,
}

interface PermissionMutation {
  [PermissionMutationContants.SET_ROUTES](state: PermissionState, routes: AppRouteRecordRaw[]): void
}

const mutations: MutationTree<PermissionState> & PermissionMutation = {
  [PermissionMutationContants.SET_ROUTES]: (state: PermissionState, routes: AppRouteRecordRaw[]) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
    state.isReqPerm = true
  },
}

type AugmentedActionContext = {
  commit<K extends keyof PermissionMutation>(
    key: K,
    payload?: Parameters<PermissionMutation[K]>[1],
  ): ReturnType<PermissionMutation[K]>
} & Omit<ActionContext<PermissionState, RootState>, 'commit'>

interface PermissionAction {
  generaterRoutes({ commit }: AugmentedActionContext, menus: MenuApiResult[]): Promise<AppRouteRecordRaw[]>
}

// 判断对比 路由 name 与 后端返回的 菜单唯一标识是否一致
const hasPermission = (route: AppRouteRecordRaw, menus: MenuApiResult[]): boolean => {
  if (route.name) {
    return menus.some((menu) => menu.code === route.name)
  }
  // route 设置 hidden 路由隐藏的 不需要判断权限
  if (route.hidden) return true
  // 当父级路由不匹配，但该路由子级路由有权限时 父级路由自动拥有权限
  if (route.children && route.children.length > 0) return hasPermission(route.children[0], menus)
  return false
}

// 递归遍历路由权限
const filterAsyncRoutes = (routes: AppRouteRecordRaw[], menus: MenuApiResult[]): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (hasPermission(tmp, menus)) {
      if (tmp.children && tmp.children.length > 0) tmp.children = filterAsyncRoutes(tmp.children, menus)
      res.push(tmp)
    }
  })
  return res
}

const actions: ActionTree<PermissionState, RootState> & PermissionAction = {
  generaterRoutes({ commit }: AugmentedActionContext, menus: MenuApiResult[]): Promise<AppRouteRecordRaw[]> {
    return new Promise((resolve) => {
      const accessRoutes: AppRouteRecordRaw[] = filterAsyncRoutes(asyncRoutes, menus)
      commit(PermissionMutationContants.SET_ROUTES, accessRoutes)
      resolve(accessRoutes)
    })
  },
}

export type PermissionStore<S = PermissionState> = Omit<VuexStore<S>, 'commit' | 'dispatch'> & {
  commit<K extends keyof PermissionMutation, P extends Parameters<PermissionMutation[K]>[1]>(
    key: K,
    payload?: P,
    options?: CommitOptions,
  ): ReturnType<PermissionMutation[K]>
} & {
  dispatch<K extends keyof PermissionAction, P extends Parameters<PermissionAction[K]>[1]>(
    key: K,
    payload?: P,
    options?: DispatchOptions,
  ): ReturnType<PermissionAction[K]>
}

export const PermissionModule: Module<PermissionState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
}
