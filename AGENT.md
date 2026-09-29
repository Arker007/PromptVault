# Strict Component Guidelines for AI Agents

1. **Ant Design Exclusive**: All UI elements MUST be constructed using official components from `antd`, `@ant-design/icons`, and `@ant-design/pro-components`.
2. **Tokens Over Hardcoded Colors**: Always resolve dynamic theme styles via `antd`'s `theme.useToken()`.
3. **No Foreign UI Frameworks**: Do not introduce non-Ant-Design component libraries or raw HTML button/input primitives with conflicting utility classes.
4. **English Locale**: Always enforce `locale={enUS}` on `ConfigProvider` and `intl={enUSIntl}` on `ProConfigProvider`.
5. **Non-Deprecated API Properties**: Always use standard, non-deprecated Ant Design properties (`open` over `visible`, `direction` over `orientation` on `Space`, `destroyOnClose` over `destroyOnHidden`, `message` over `title` on `Alert`, `width` for Drawer pixel dimensions, `items` arrays for Tabs/Collapse/Descriptions/Breadcrumb/Dropdown, `styles` over `bodyStyle`/`headStyle`/`maskStyle`).
6. **Feature-Sliced Design (FSD)**: Enforce clean division into `app/` (bootstrapping/routing), `features/` (fully self-contained business slices containing `components/`, `hooks/`, `api/`, `types/`), and `shared/` (domain-agnostic helper libraries). Feature slices MUST NOT import internal modules directly from other feature slices to ensure absolute dependency encapsulation.

