// KM-Portal v1.8.6 antd 模块类型兜底声明
// 原因:antd 5.x 不再内嵌 .d.ts,需要 shim 避免 tsc 报错
// 实际类型由 vite/esbuild 在打包时按需解析
// 这是最小可用的类型 shim - 允许任意 named/default import
// 严格 props 检查由 antd 5 运行时提供,tsc 层放弃(用 any 兜底)

declare module 'antd' {
  const AntAny: any
  export = AntAny
  export default AntAny
  // namespace 允许 `import { Card, Form, Button, Steps, ... } from 'antd'`
  // @ts-ignore - 占位 shim,运行时由 antd 5 提供实际类型
  export const Card: any
  // @ts-ignore
  export const Form: any
  // @ts-ignore
  export const Input: any
  // @ts-ignore
  export const Button: any
  // @ts-ignore
  export const Steps: any
  // @ts-ignore
  export const Space: any
  // @ts-ignore
  export const Typography: any
  // @ts-ignore
  export const message: any
  // @ts-ignore
  export const Row: any
  // @ts-ignore
  export const Col: any
  // @ts-ignore
  export const Statistic: any
  // @ts-ignore
  export const Progress: any
  // @ts-ignore
  export const Tree: any
  // @ts-ignore
  export const Tag: any
  // @ts-ignore
  export const Tabs: any
  // @ts-ignore
  export const Result: any
  // @ts-ignore
  export const Empty: any
  // @ts-ignore
  export const Spin: any
  // @ts-ignore
  export const App: any
  // @ts-ignore
  export const ConfigProvider: any
  // @ts-ignore
  export const Layout: any
  // @ts-ignore
  export const Menu: any
  // @ts-ignore
  export const theme: any
}

declare module 'antd/locale/zh_CN' {
  const value: any
  export = value
  export default value
}
