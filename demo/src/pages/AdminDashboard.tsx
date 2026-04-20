import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, ConfigProvider, theme } from 'antd';
import { Line, Bar } from '@ant-design/charts';
import {
  MessageOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Types ---
interface SummaryData {
  totalSessions: number;
  totalMessages: number;
  positiveRatio: number;
  quickAskCount: number;
}
interface SentimentData { hour: string; positive: number; negative: number; neutral: number; }
interface PopularQuestion { question: string; count: number; type: string; }
interface LatencyData { p50Ms: number; p90Ms: number; maxMs: number; }
interface EventData { event: string; timestamp: string; }
interface RealtimeData { activeSessions5min: number; recentEvents: EventData[]; }

const BASE_URL = 'http://127.0.0.1:5002/api';

export const AdminDashboard: React.FC = () => {
  // --- States ---
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const [summary, setSummary] = useState<SummaryData>({ totalSessions: 0, totalMessages: 0, positiveRatio: 0, quickAskCount: 0 });
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([]);
  const [popularQuestions, setPopularQuestions] = useState<PopularQuestion[]>([]);
  const [latency, setLatency] = useState<LatencyData>({ p50Ms: 0, p90Ms: 0, maxMs: 0 });
  const [realtime, setRealtime] = useState<RealtimeData>({ activeSessions5min: 0, recentEvents: [] });

  // --- Styles ---
  const screenBg = '#0f172a';
  const goldColor = '#b7791f';
  const cardStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    boxShadow: '0 0 12px rgba(183,121,31,0.3)',
    borderRadius: '8px',
    height: '100%'
  };
  const titleStyle: React.CSSProperties = { color: goldColor, margin: 0 };

  // --- Clock ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss')), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Data Fetching ---
  const fetchData = async (endpoint: string, setter: (v: any) => void, transform?: (data: any) => any) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`);
      const data = await res.json();
      setter(transform ? transform(data) : data);
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}`, error);
    }
  };

  useEffect(() => {
    // 1. Summary (30s)
    fetchData('/summary', setSummary);
    const summaryInterval = setInterval(() => fetchData('/summary', setSummary), 30000);

    // 2. Sentiment Trend (5m) — 宽表转长表供折线图使用
    const formatSentiment = (data: SentimentData[]) => {
      const formatted: any[] = [];
      data.forEach(d => {
        formatted.push({ hour: d.hour, value: d.positive, type: '正面' });
        formatted.push({ hour: d.hour, value: d.negative, type: '负面' });
        formatted.push({ hour: d.hour, value: d.neutral,  type: '中性' });
      });
      return formatted;
    };
    fetchData('/sentiment-trend?hours=12', setSentimentTrend, formatSentiment);
    const sentimentInterval = setInterval(
      () => fetchData('/sentiment-trend?hours=12', setSentimentTrend, formatSentiment),
      300000
    );

    // 3. Popular Questions (5m)
    fetchData('/popular-questions?limit=10', setPopularQuestions);
    const popularInterval = setInterval(
      () => fetchData('/popular-questions?limit=10', setPopularQuestions),
      300000
    );

    // 4. Latency Stats (30s)
    fetchData('/latency-stats', setLatency);
    const latencyInterval = setInterval(() => fetchData('/latency-stats', setLatency), 30000);

    // 5. Realtime (10s)
    fetchData('/realtime', setRealtime);
    const realtimeInterval = setInterval(() => fetchData('/realtime', setRealtime), 10000);

    return () => {
      clearInterval(summaryInterval);
      clearInterval(sentimentInterval);
      clearInterval(popularInterval);
      clearInterval(latencyInterval);
      clearInterval(realtimeInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Event Tag Mapper ---
  const renderEventTag = (event: string) => {
    const map: Record<string, { label: string; color: string }> = {
      user_message:      { label: '用户提问', color: 'blue' },
      ai_reply:          { label: 'AI 回复',  color: 'green' },
      audio_play_start:  { label: '开始播放', color: 'gold' },
      session_start:     { label: '会话开始', color: 'purple' },
      session_end:       { label: '会话结束', color: 'default' },
      quick_ask:         { label: '快捷问题', color: 'cyan' },
      voice_start:       { label: '开始录音', color: 'orange' },
    };
    const mapped = map[event] ?? { label: event, color: 'default' };
    return <Tag color={mapped.color}>{mapped.label}</Tag>;
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ backgroundColor: screenBg, minHeight: '100vh', padding: '24px', color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={titleStyle}>灵山胜境 · AI 导览数据大屏</Title>
          <Text style={{ fontSize: '20px', color: '#94a3b8', fontFamily: 'monospace' }}>{currentTime}</Text>
        </div>

        {/* 第一行：KPI 卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={4}>
            <Card style={cardStyle} bordered={false}>
              <Statistic
                title={<span style={{ color: '#94a3b8' }}>今日对话量</span>}
                value={summary.totalMessages}
                prefix={<MessageOutlined style={{ color: goldColor }} />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={cardStyle} bordered={false}>
              <Statistic
                title={<span style={{ color: '#94a3b8' }}>正面情感率</span>}
                value={summary.positiveRatio * 100}
                precision={1}
                suffix="%"
                prefix={<SmileOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={cardStyle} bordered={false}>
              <Statistic
                title={<span style={{ color: '#94a3b8' }}>快捷问题点击数</span>}
                value={summary.quickAskCount}
                prefix={<ThunderboltOutlined style={{ color: goldColor }} />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={cardStyle} bordered={false}>
              <Statistic
                title={<span style={{ color: '#94a3b8' }}>P90 响应时长 (ms)</span>}
                value={latency.p90Ms}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: latency.p90Ms > 3000 ? '#fa8c16' : '#fff' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={cardStyle} bordered={false}>
              <Statistic
                title={<span style={{ color: '#94a3b8' }}>实时活跃会话 (5min)</span>}
                value={realtime.activeSessions5min}
                prefix={<FireOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 第二行：图表区 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={14}>
            <Card
              title={<span style={{ color: '#e2e8f0' }}>情感趋势（过去 12 小时）</span>}
              style={{ ...cardStyle, height: 380 }}
              bordered={false}
              bodyStyle={{ height: 300 }}
            >
              <Line
                data={sentimentTrend}
                xField="hour"
                yField="value"
                seriesField="type"
                color={['#52c41a', '#f5222d', '#8c8c8c']}
                legend={{ position: 'top' }}
                smooth
                tooltip={{ showMarkers: true }}
              />
            </Card>
          </Col>
          <Col span={10}>
            <Card
              title={<span style={{ color: '#e2e8f0' }}>热门问题 Top 10</span>}
              style={{ ...cardStyle, height: 380 }}
              bordered={false}
              bodyStyle={{ height: 300 }}
            >
              <Bar
                data={popularQuestions}
                xField="count"
                yField="question"
                seriesField="question"
                color={goldColor}
                label={{ position: 'right' }}
                barWidthRatio={0.6}
                legend={false}
              />
            </Card>
          </Col>
        </Row>

        {/* 第三行：响应时长 + 事件流 */}
        <Row gutter={[16, 16]}>
          <Col span={10}>
            <Card
              title={<span style={{ color: '#e2e8f0' }}>响应时长分布 (ms)</span>}
              style={{ ...cardStyle, height: 300 }}
              bordered={false}
            >
              <Row gutter={[16, 16]} justify="space-around" style={{ marginTop: '20px' }}>
                <Col>
                  <Statistic
                    title={<span style={{ color: '#94a3b8' }}>P50 中位数</span>}
                    value={latency.p50Ms}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={<span style={{ color: '#94a3b8' }}>P90</span>}
                    value={latency.p90Ms}
                    valueStyle={{ color: latency.p90Ms > 3000 ? '#f5222d' : '#fff', fontSize: '32px' }}
                  />
                </Col>
                <Col>
                  <Statistic
                    title={<span style={{ color: '#94a3b8' }}>Max 最大值</span>}
                    value={latency.maxMs}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={14}>
            <Card
              title={<span style={{ color: '#e2e8f0' }}>最近事件流</span>}
              style={{ ...cardStyle, height: 300 }}
              bordered={false}
              bodyStyle={{ height: 220, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {realtime.recentEvents.length === 0 && (
                  <Text style={{ color: '#475569' }}>暂无事件，等待数据接入…</Text>
                )}
                {realtime.recentEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#334155', borderRadius: '4px' }}
                  >
                    <Text style={{ color: '#94a3b8', marginRight: '16px', fontFamily: 'monospace', flexShrink: 0 }}>
                      {dayjs(evt.timestamp).format('HH:mm:ss')}
                    </Text>
                    {renderEventTag(evt.event)}
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

      </div>
    </ConfigProvider>
  );
};

export default AdminDashboard;
