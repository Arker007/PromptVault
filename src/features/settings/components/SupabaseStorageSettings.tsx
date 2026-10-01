import React, { useState } from 'react';
import { Alert, Tabs, theme } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import {
  SettingOutlined,
  CodeOutlined,
  SyncOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useSupabaseConfig } from '@/features/supabase/hooks/useSupabaseConfig.ts';
import { useSupabaseStats } from '@/features/supabase/hooks/useSupabaseStats.ts';
import { useSupabaseSync } from '@/features/supabase/hooks/useSupabaseSync.ts';
import { useSupabaseBackups } from '@/features/supabase/hooks/useSupabaseBackups.ts';
import { SupabaseStatsRow } from '@/features/supabase/components/SupabaseStatsRow.tsx';
import { SupabaseCredentialsCard } from '@/features/supabase/components/SupabaseCredentialsCard.tsx';
import { SupabaseSchemaSetupCard } from '@/features/supabase/components/SupabaseSchemaSetupCard.tsx';
import { SupabaseDataSyncCard } from '@/features/supabase/components/SupabaseDataSyncCard.tsx';
import { SupabaseBackupsCard } from '@/features/supabase/components/SupabaseBackupsCard.tsx';
import { SupabaseSqlModal } from '@/features/supabase/components/SupabaseSqlModal.tsx';
import { message } from '@/shared/lib/message.ts';

export const SupabaseStorageSettings: React.FC = () => {
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [subTab, setSubTab] = useState<string>('credentials');
  const { token } = theme.useToken();

  // Custom Feature Hooks
  const { config, isLoading: isConfigLoading, saveConfig, testConnection, isTesting: isTestingConnection } = useSupabaseConfig();
  const { dbStats, isDbStatsLoading, refetchDbStats, schemaSql, testDbConnection, isTestingDb } = useSupabaseStats();
  const { pushLocalToRemote, isSyncing, pullRemoteToLocal, isFetchingRemote, deduplicatePrompts, isDeduplicating } = useSupabaseSync();
  const {
    backups,
    isLoading: isBackupsLoading,
    refetchBackups,
    createSnapshot,
    isCreatingSnapshot,
    restoreBackup,
    isRestoring,
    deleteBackup,
    isDeleting,
  } = useSupabaseBackups();

  const handleCopySchemaSql = () => {
    if (schemaSql) {
      navigator.clipboard.writeText(schemaSql);
      setIsCopied(true);
      message.success('SQL schema script copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const isConfigured = Boolean(dbStats?.isConfigured);

  const tabItems = [
    {
      key: 'credentials',
      icon: <SettingOutlined />,
      label: 'Connection Credentials',
    },
    {
      key: 'schema',
      icon: <CodeOutlined />,
      label: 'Database Schema Setup',
    },
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: 'Sync & Data Migration',
    },
    {
      key: 'backups',
      icon: <CloudUploadOutlined />,
      label: 'Snapshots & Backups',
    },
  ];

  return (
    <div style={{ width: '100%', paddingTop: 4 }}>
      {/* DB Connection Status Alert */}
      {dbStats && (
        <div style={{ marginBottom: 16 }}>
          {isConfigured ? (
            <Alert
              type="success"
              showIcon
              message="Supabase Connected & Auto-Sync Active"
              description="Your prompt library automatically fetches and synchronizes data with your Supabase PostgreSQL database."
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Supabase Disconnected"
              description="Please configure credentials and verify that the SQL database schema is setup to enable automatic syncing."
            />
          )}
        </div>
      )}

      {/* 4-Card Stats Summary Row */}
      <div style={{ marginBottom: 24 }}>
        <SupabaseStatsRow stats={dbStats?.stats} />
      </div>

      {/* Main Settings Card organized by top level Tabs */}
      <ProCard
        bordered
        style={{
          borderRadius: token.borderRadiusLG,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Tabs
          activeKey={subTab}
          onChange={setSubTab}
          items={tabItems}
          style={{ marginBottom: 20 }}
        />

        {/* Dynamic Display Sections to guarantee forms remain always-mounted */}
        <div style={{ display: subTab === 'credentials' ? 'block' : 'none' }}>
          <SupabaseCredentialsCard
            config={config}
            isConfigLoading={isConfigLoading}
            onSaveConfig={saveConfig}
            onTestConnection={testConnection}
            isTestingConnection={isTestingConnection}
          />
        </div>

        <div style={{ display: subTab === 'schema' ? 'block' : 'none' }}>
          <SupabaseSchemaSetupCard
            onTestDbTables={testDbConnection}
            isTestingDb={isTestingDb}
            onOpenSqlModal={() => setSchemaModalOpen(true)}
            onCopySchemaSql={handleCopySchemaSql}
            isCopied={isCopied}
          />
        </div>

        <div style={{ display: subTab === 'sync' ? 'block' : 'none' }}>
          <SupabaseDataSyncCard
            isConfigured={isConfigured}
            onOpenSqlModal={() => setSchemaModalOpen(true)}
            onRefetchStats={refetchDbStats}
            isDbStatsLoading={isDbStatsLoading}
            onPushLocalToRemote={pushLocalToRemote}
            isSyncing={isSyncing}
            onPullRemoteToLocal={pullRemoteToLocal}
            isFetchingRemote={isFetchingRemote}
            onDeduplicate={deduplicatePrompts}
            isDeduplicating={isDeduplicating}
            stats={dbStats?.stats}
          />
        </div>

        <div style={{ display: subTab === 'backups' ? 'block' : 'none' }}>
          <SupabaseBackupsCard
            backups={backups}
            isLoading={isBackupsLoading}
            onRefetchBackups={refetchBackups}
            onCreateSnapshot={createSnapshot}
            isCreatingSnapshot={isCreatingSnapshot}
            onRestoreBackup={restoreBackup}
            isRestoring={isRestoring}
            onDeleteBackup={deleteBackup}
            isDeleting={isDeleting}
          />
        </div>
      </ProCard>

      {/* SQL Schema Preview Modal */}
      <SupabaseSqlModal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        schemaSql={schemaSql}
        onCopySchemaSql={handleCopySchemaSql}
        isCopied={isCopied}
      />
    </div>
  );
};
