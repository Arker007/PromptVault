import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';
import { AppShell } from '@/app/layouts/AppShell/AppShell.tsx';
import { PromptLibraryPage } from '@/features/prompts/pages/PromptLibraryPage.tsx';
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage.tsx';
import { CollectionsPage } from '@/features/collections/pages/CollectionsPage.tsx';
import { TagsPage } from '@/features/tags/pages/TagsPage.tsx';
import { SettingsPage } from '@/features/settings/pages/SettingsPage.tsx';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Public Application Website Routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/prompts" replace />} />
          <Route path="/prompts" element={<PromptLibraryPage preset="all" />} />
          <Route path="/prompts/pinned" element={<PromptLibraryPage preset="pinned" />} />
          <Route path="/prompts/favorites" element={<PromptLibraryPage preset="favorites" />} />
          <Route path="/prompts/recent" element={<PromptLibraryPage preset="recent" />} />
          <Route path="/prompts/archived" element={<PromptLibraryPage preset="archived" />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/tags" element={<TagsPage />} />

          {/* Settings routes are protected inside AppShell */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Navigate to="/settings/profile" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/security"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/preferences"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/supabase"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/backup"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/prompts" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
