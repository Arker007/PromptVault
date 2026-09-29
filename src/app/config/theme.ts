import { ThemeConfig, theme } from 'antd';

export function getAppTheme(isDarkMode: boolean): ThemeConfig {
  return {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      fontSize: 14,
      borderRadius: 6,
      controlHeight: 36,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      wireframe: false,
    },
    components: {
      Layout: {
        headerBg: isDarkMode ? '#141414' : '#ffffff',
        headerHeight: 64,
        headerPadding: '0 24px',
        siderBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        bodyBg: isDarkMode ? '#000000' : '#f5f5f5',
      },
      Menu: {
        itemHeight: 40,
        itemBorderRadius: 6,
        itemMarginInline: 8,
      },
      Button: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Input: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Select: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Table: {
        borderRadius: 6,
        headerBorderRadius: 6,
      },
      Drawer: {
        borderRadiusSM: 0,
      },
      Typography: {
        titleMarginBottom: 0,
      },
    },
  };
}
