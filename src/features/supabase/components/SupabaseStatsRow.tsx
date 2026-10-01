import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
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
        <Card
          bordered
          style={{ height: '100%' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Statistic
            title="Prompts in Remote DB"
            value={stats?.prompts ?? 0}
            prefix={<DatabaseOutlined style={{ color: '#1677ff', marginRight: 4 }} />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered
          style={{ height: '100%' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Statistic
            title="Categories"
            value={stats?.categories ?? 0}
            prefix={<FolderOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered
          style={{ height: '100%' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Statistic
            title="Collections"
            value={stats?.collections ?? 0}
            prefix={<InboxOutlined style={{ color: '#fa8c16', marginRight: 4 }} />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered
          style={{ height: '100%' }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Statistic
            title="Tags"
            value={stats?.tags ?? 0}
            prefix={<CodeOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
          />
        </Card>
      </Col>
    </Row>
  );
};
