# AI Agent Guidelines & Architecture Rules

## 1. Strict Component Rule: Ant Design Library Only
**MANDATORY RULE**: All UI components in this application MUST be imported exclusively from the **Ant Design (`antd`)** ecosystem (`antd`, `@ant-design/icons`, `@ant-design/pro-components`).

- **DO NOT** create custom ad-hoc HTML buttons, modals, dropdowns, tooltips, dialogs, tags, inputs, tables, or drawers.
- **DO NOT** use generic UI libraries (e.g., shadcn, MUI, Bootstrap, Chakra) or hand-coded equivalents.
- **DO NOT** override Ant Design component styles with arbitrary utility classes that break Light/Dark theme synchronization.

---

## 2. Approved Ant Design Component Mapping

| UI Category | Approved Components |
|---|---|
| **Layout & Structure** | `<Layout>`, `<Layout.Header>`, `<Layout.Sider>`, `<Layout.Content>`, `<Flex>`, `<Space>`, `<Row>`, `<Col>`, `<ProLayout>`, `<ProConfigProvider>` |
| **Typography** | `<Typography.Title>`, `<Typography.Text>`, `<Typography.Paragraph>`, `<Typography.Link>` |
| **Buttons & Actions** | `<Button>`, `<Dropdown>`, `<Menu>`, `<Breadcrumb>`, `<Pagination>`, `<FloatButton>` |
| **Data Entry & Forms** | `<Form>`, `<Form.Item>`, `<Input>`, `<Input.TextArea>`, `<Input.Search>`, `<InputNumber>`, `<Select>`, `<Radio>`, `<Checkbox>`, `<Switch>`, `<DatePicker>`, `<Upload>`, `<Slider>`, `<Rate>`, `<Cascader>`, `<TreeSelect>` |
| **Data Display** | `<Table>`, `<List>`, `<Card>`, `<Tag>`, `<Badge>`, `<Avatar>`, `<Descriptions>`, `<Timeline>`, `<Tabs>`, `<Segmented>`, `<Collapse>`, `<Statistic>`, `<Tree>`, `<Image>`, `<Popover>`, `<Tooltip>` |
| **Feedback & Overlays** | `<Modal>`, `<Drawer>`, `<Popconfirm>`, `<Alert>`, `<Spin>`, `<Skeleton>`, `<Empty>`, `<Result>`, `<Progress>`, `message` (from App context), `notification` |
| **Icons** | `@ant-design/icons` (e.g., `PlusOutlined`, `SearchOutlined`, `EditOutlined`, `DeleteOutlined`, etc.) |

---

## 3. Styling with Ant Design Design Tokens (`theme.useToken`)
Always use Ant Design's unified token system to ensure 100% theme compatibility (Light & Dark modes):

```tsx
import { theme } from 'antd';

const MyComponent: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        color: token.colorText,
        padding: token.padding,
      }}
    >
      <Text style={{ color: token.colorTextSecondary }}>Subtitle</Text>
    </div>
  );
};
```

### Key Token Reference:
- **Backgrounds**: `token.colorBgContainer`, `token.colorBgLayout`, `token.colorBgElevated`, `token.controlItemBgHover`, `token.controlItemBgActive`
- **Borders**: `token.colorBorder`, `token.colorBorderSecondary`, `token.colorPrimaryBorder`
- **Text**: `token.colorText`, `token.colorTextSecondary`, `token.colorTextTertiary`, `token.colorTextQuaternary`
- **Primary Brand**: `token.colorPrimary`, `token.colorPrimaryHover`, `token.colorPrimaryActive`
- **Radii**: `token.borderRadius`, `token.borderRadiusSM`, `token.borderRadiusLG`

---

## 4. Internationalization & English Language
- `ConfigProvider` must always include `locale={enUS}` from `antd/locale/en_US`.
- `ProConfigProvider` must always include `intl={enUSIntl}` from `@ant-design/pro-components`.
- All custom strings, placeholders, empty states, and validation messages must be in clear English.

---

## 5. State & Server Communication Standards
- **Server State**: Use `@tanstack/react-query` (`useQuery`, `useMutation`, `queryClient.invalidateQueries`).
- **HTTP Client**: Use `apiClient` (`/src/shared/api/apiClient.ts`).
- **Notifications**: Use `message` and `modal` from Ant Design's `<App>` context (`/src/shared/lib/message.ts`).

---

## 6. Feature-Sliced Design (FSD) Directory Rules
To maintain a highly decoupled, scalable, and professional codebase, we enforce strict **Feature-Sliced Design (FSD)** principles for directory organization:

### Layering Architecture:
1. **App Layer (`/src/app/`)**: Global application-level bootstrapping, routing configs (`AppRouter`), entrypoint style imports, global layout providers, and React Query/Theme wrappers.
2. **Features Layer (`/src/features/`)**: Slices grouped exclusively by business domain values (e.g., `auth`, `prompts`, `categories`, `collections`, `tags`, `supabase`, `settings`). Each feature slice must be fully self-contained and organized into:
   - `components/`: Pure visual elements, custom widgets, or forms specific to this feature.
   - `hooks/`: Feature-scoped business logic hooks (e.g., React Query hooks).
   - `api/`: REST endpoints / backend clients specific to this slice.
   - `types/`: Type declarations and DTO mappings specific to this slice.
3. **Shared Layer (`/src/shared/`)**: Reusable, domain-agnostic helpers (e.g. `apiClient`, notifications `message`, common models, and cross-cutting constants).

### Dependency & Import Rules:
- **Strict Isolation**: A feature slice **MUST NOT** import internal helper functions, components, or hooks directly from another feature slice's internal folders.
- **Shared Promotion**: If a module or sub-component becomes useful in more than one business feature, it **MUST** be promoted to `/src/shared/` to maintain clean boundary encapsulation.
- **No Circular Imports**: Avoid circular dependencies across layers (e.g., shared importing features, or app layer importing components inside features directly outside of standard routing).
