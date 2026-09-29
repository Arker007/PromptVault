import React, { useState, useEffect } from 'react';
import { Layout, Grid, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar.tsx';
import { AppHeader } from './AppHeader.tsx';
import { MobileNavigation } from './MobileNavigation.tsx';
import { GlobalSearchModal } from '@/features/search/components/GlobalSearchModal.tsx';
import { PromptFormDrawer } from '@/features/prompts/components/PromptFormDrawer.tsx';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export const AppShell: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createPromptOpen, setCreatePromptOpen] = useState(false);

  // Keyboard shortcuts: Cmd+K / Ctrl+K for search, N for new prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setCreatePromptOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <AppSidebar
          collapsed={siderCollapsed}
          onCollapse={(val) => setSiderCollapsed(val)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      {isMobile && (
        <MobileNavigation
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      <Layout style={{ minWidth: 0, backgroundColor: token.colorBgLayout }}>
        <AppHeader
          isMobile={isMobile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNewPrompt={() => setCreatePromptOpen(true)}
        />

        <Content
          style={{
            padding: isMobile ? '16px' : '24px',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet context={{ onOpenNewPrompt: () => setCreatePromptOpen(true) }} />
        </Content>
      </Layout>

      {/* Global Search Modal */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPrompt={(id) => {
          setSearchOpen(false);
          navigate(`/prompts?detailId=${id}`);
        }}
        onSelectCategory={(id) => {
          setSearchOpen(false);
          navigate(`/prompts?category=${id}`);
        }}
        onSelectCollection={(id) => {
          setSearchOpen(false);
          navigate(`/prompts?collection=${id}`);
        }}
        onSelectTag={(name) => {
          setSearchOpen(false);
          navigate(`/prompts?tags=${encodeURIComponent(name)}`);
        }}
      />

      {/* Global Create Prompt Drawer */}
      <PromptFormDrawer
        open={createPromptOpen}
        onClose={() => setCreatePromptOpen(false)}
      />
    </Layout>
  );
};
