import React from 'react';
import { Row, Col } from 'antd';
import { StatisticCard } from '@ant-design/pro-components';
import {
  DatabaseOutlined,
  FolderOutlined,
  InboxOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { SupabaseDbStats } from '../types/index.ts';

interface SupabaseStatsRowProps {
  stats?: SupabaseDbStats['stats'];
}

export const SupabaseStatsRow: React.FC<SupabaseStatsRowProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <StatisticCard
          bordered
          style={{ height: '100%' }}
          bodyStyle={{ padding: '12px 16px' }}
          statistic={{
            title: 'Prompts in Remote DB',
            value: stats?.prompts ?? 0,
            icon: <DatabaseOutlined style={{ color: '#1677ff', fontSize: 20 }} />,
          }}
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <StatisticCard
          bordered
          style={{ height: '100%' }}
          bodyStyle={{ padding: '12px 16px' }}
          statistic={{
            title: 'Categories',
            value: stats?.categories ?? 0,
            icon: <FolderOutlined style={{ color: '#52c41a', fontSize: 20 }} />,
          }}
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <StatisticCard
          bordered
          style={{ height: '100%' }}
          bodyStyle={{ padding: '12px 16px' }}
          statistic={{
            title: 'Collections',
            value: stats?.collections ?? 0,
            icon: <InboxOutlined style={{ color: '#fa8c16', fontSize: 20 }} />,
          }}
        />
      </Col>

      <Col xs={24} sm={12} md={6}>
        <StatisticCard
          bordered
          style={{ height: '100%' }}
          bodyStyle={{ padding: '12px 16px' }}
          statistic={{
            title: 'Tags',
            value: stats?.tags ?? 0,
            icon: <CodeOutlined style={{ color: '#722ed1', fontSize: 20 }} />,
          }}
        />
      </Col>
    </Row>
  );
};
