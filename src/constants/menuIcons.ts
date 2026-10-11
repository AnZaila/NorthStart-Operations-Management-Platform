import type { Component } from 'vue'
import {
  Bell,
  Collection,
  Connection,
  Cpu,
  Document,
  Folder,
  House,
  Key,
  Lock,
  Menu,
  Monitor,
  Odometer,
  OfficeBuilding,
  Paperclip,
  Postcard,
  Setting,
  Tickets,
  Tools,
  User,
  UserFilled,
} from '@element-plus/icons-vue'

export const menuIconMap: Record<string, Component> = {
  Bell,
  Collection,
  Connection,
  Cpu,
  Document,
  Folder,
  House,
  Key,
  Lock,
  Menu,
  Monitor,
  Odometer,
  OfficeBuilding,
  Paperclip,
  Postcard,
  Setting,
  Tickets,
  Tools,
  User,
  UserFilled,
}

export function resolveMenuIcon(icon?: string) {
  return icon && menuIconMap[icon] ? menuIconMap[icon] : Folder
}
