
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Dimensions, Modal, Alert, Platform, RefreshControl
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  ArrowLeft, Download, TrendingUp, CheckCircle, BarChart3,
  Map as MapIcon, X, AlertCircle, Clock, Zap, Users, Shield,
  ChevronDown, ChevronUp, Target, Activity, Award
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  primary: '#1E88E5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  orange: '#F97316',
  pink: '#EC4899',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  rose: '#F43F5E',
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#6366F1',
  in_progress: '#8B5CF6',
  assigned: '#8B5CF6',
  resolved: '#10B981',
  closed: '#10B981',
  completed: '#10B981',
  appealed: '#EF4444',
  critical_failure: '#DC2626',
  rejected: '#9CA3AF',
};

const MAP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'critical', label: 'Critical' },
];

export default function AdminAnalyticsScreen({ navigation, darkMode }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);
  const [showDeptDetail, setShowDeptDetail] = useState(false);
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [showResolutionChart, setShowResolutionChart] = useState(true);
  const [mapFilter, setMapFilter] = useState('all');
  const mapRef = useRef(null);

  const DEFAULT_REGION = {
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/analytics');
      setData(res.data);
    } catch (e) {
      console.error('Admin Analytics Error:', e);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const summary = data?.summary || {};
  const categoryBreakdown = data?.categoryBreakdown || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const deptPerformance = data?.deptPerformance || [];
  const heatmapPointsRaw = data?.heatmapPoints || [];
  const resolutionBuckets = data?.resolutionBuckets || {};
  const topEngaged = data?.topEngaged || [];

  // Filtered heatmap points
  const filteredHeatmapPoints = useMemo(() => {
    const resolvedSet = new Set(['resolved', 'closed', 'completed']);
    const activeSet = new Set(['pending', 'accepted', 'in_progress', 'assigned', 'appealed']);
    return heatmapPointsRaw.filter(p => {
      const s = (p.status || '').toLowerCase();
      if (mapFilter === 'resolved') return resolvedSet.has(s);
      if (mapFilter === 'active') return activeSet.has(s);
      if (mapFilter === 'critical') return s === 'critical_failure';
      return true;
    });
  }, [heatmapPointsRaw, mapFilter]);

  const heatmapData = useMemo(() => {
    const buckets = new Map();
    for (const p of filteredHeatmapPoints) {
      const key = `${p.latitude.toFixed(4)}:${p.longitude.toFixed(4)}`;
      const existing = buckets.get(key);
      if (existing) existing.weight += 1;
      else buckets.set(key, { latitude: p.latitude, longitude: p.longitude, weight: 1 });
    }
    return Array.from(buckets.values());
  }, [filteredHeatmapPoints]);

  // Chart data: Status breakdown
  const statusChartData = useMemo(() => ({
    labels: ['Pending', 'Active', 'Resolved', 'Appeals', 'Critical'],
    datasets: [{
      data: [
        summary.pending || 0,
        (summary.accepted || 0) + (summary.inProgress || 0),
        summary.resolved || 0,
        summary.appealed || 0,
        summary.criticalFailures || 0,
      ]
    }]
  }), [summary]);

  // Monthly trends chart
  const trendChartData = useMemo(() => {
    const recent = monthlyTrends.slice(-6);
    return {
      labels: recent.map(m => m.month),
      datasets: [
        { data: recent.map(m => m.submitted || 0) },
      ]
    };
  }, [monthlyTrends]);

  // Resolution distribution chart
  const resolutionChartData = useMemo(() => {
    const labels = Object.keys(resolutionBuckets);
    const values = Object.values(resolutionBuckets);
    return {
      labels: labels.length > 0 ? labels : ['N/A'],
      datasets: [{ data: values.length > 0 && values.some(v => v > 0) ? values : [0] }]
    };
  }, [resolutionBuckets]);

  // Most affected category
  const mostAffected = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const themedChartConfig = useMemo(() => ({
    backgroundColor: darkMode ? '#111827' : '#FFFFFF',
    backgroundGradientFrom: darkMode ? '#111827' : '#FFFFFF',
    backgroundGradientTo: darkMode ? '#111827' : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => darkMode
      ? `rgba(96, 165, 250, ${opacity})`
      : `rgba(30, 136, 229, ${opacity})`,
    labelColor: (opacity = 1) => darkMode
      ? `rgba(209, 213, 219, ${opacity})`
      : `rgba(75, 85, 99, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.55,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: darkMode ? '#1F2937' : '#F3F4F6',
    },
  }), [darkMode]);

  const trendChartConfig = useMemo(() => ({
    ...themedChartConfig,
    color: (opacity = 1) => darkMode
      ? `rgba(16, 185, 129, ${opacity})`
      : `rgba(16, 185, 129, ${opacity})`,
  }), [darkMode, themedChartConfig]);

  const resolutionChartConfig = useMemo(() => ({
    ...themedChartConfig,
    color: (opacity = 1) => darkMode
      ? `rgba(139, 92, 246, ${opacity})`
      : `rgba(99, 102, 241, ${opacity})`,
  }), [darkMode, themedChartConfig]);

  // Fit map to markers
  useEffect(() => {
    if (!showMap || filteredHeatmapPoints.length === 0 || !mapRef.current?.fitToCoordinates) return;
    const timer = setTimeout(() => {
      mapRef.current.fitToCoordinates(
        filteredHeatmapPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [showMap, filteredHeatmapPoints]);

  // PDF Generation
  const generatePDF = async () => {
    try {
      const htmlContent = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>CityZen Admin Analytics Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; background: #fff; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1E88E5; padding-bottom: 20px; }
        .header h1 { color: #1E88E5; margin: 0 0 8px 0; font-size: 28px; }
        .header p { margin: 4px 0; color: #6B7280; font-size: 12px; }
        .section-title { font-size: 18px; font-weight: bold; color: #1F2937; margin: 28px 0 14px 0; border-bottom: 2px solid #E5E7EB; padding-bottom: 6px; }
        .metrics { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .metric-box { flex: 1; min-width: 140px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 16px; border-radius: 10px; border: 1px solid #E5E7EB; }
        .metric-label { font-size: 10px; color: #6B7280; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1F2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th { background-color: #1E88E5; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }
        tr:nth-child(even) { background-color: #F9FAFB; }
        .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 11px; border-top: 1px solid #E5E7EB; padding-top: 16px; }
      </style></head><body>
        <div class="header">
          <h1>🏙 CityZen Admin Analytics Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>System-wide Overview</strong></p>
        </div>
        <div class="section-title">Key Performance Indicators</div>
        <div class="metrics">
          <div class="metric-box"><div class="metric-label">Total Cases</div><div class="metric-value">${summary.total || 0}</div></div>
          <div class="metric-box"><div class="metric-label">Resolved</div><div class="metric-value">${summary.resolved || 0}</div></div>
          <div class="metric-box"><div class="metric-label">Pending</div><div class="metric-value">${summary.pending || 0}</div></div>
          <div class="metric-box"><div class="metric-label">In Progress</div><div class="metric-value">${(summary.accepted || 0) + (summary.inProgress || 0)}</div></div>
          <div class="metric-box"><div class="metric-label">Appeals</div><div class="metric-value">${summary.appealed || 0}</div></div>
          <div class="metric-box"><div class="metric-label">Escalated</div><div class="metric-value">${summary.escalated || 0}</div></div>
          <div class="metric-box"><div class="metric-label">Critical</div><div class="metric-value">${summary.criticalFailures || 0}</div></div>
          <div class="metric-box"><div class="metric-label">Service Health</div><div class="metric-value">${summary.serviceHealth || 0}%</div></div>
          <div class="metric-box"><div class="metric-label">Avg Resolution</div><div class="metric-value">${summary.avgResolutionHrs || 0}h</div></div>
          <div class="metric-box"><div class="metric-label">Citizen Rating</div><div class="metric-value">${summary.avgRating || 0}/5 ★</div></div>
        </div>
        <div class="section-title">Category Breakdown</div>
        <table><thead><tr><th>Category</th><th>Total</th><th>Resolved</th><th>Pending</th><th>In Progress</th><th>Critical</th></tr></thead><tbody>
          ${categoryBreakdown.map(cat => `<tr><td>${cat.name}</td><td>${cat.total}</td><td>${cat.resolved}</td><td>${cat.pending}</td><td>${cat.inProgress}</td><td>${cat.critical}</td></tr>`).join('')}
        </tbody></table>
        <div class="section-title">Department Performance</div>
        <table><thead><tr><th>Department</th><th>Active</th><th>Resolved</th><th>Critical</th><th>Performance</th></tr></thead><tbody>
          ${deptPerformance.map(d => `<tr><td>${d.name}</td><td>${d.active}</td><td>${d.resolved}</td><td>${d.critical}</td><td>${d.performance != null ? d.performance + '%' : 'N/A'}</td></tr>`).join('')}
        </tbody></table>
        <div class="section-title">Monthly Trends (Last 12 Months)</div>
        <table><thead><tr><th>Month</th><th>Submitted</th><th>Resolved</th></tr></thead><tbody>
          ${monthlyTrends.map(m => `<tr><td>${m.month}</td><td>${m.submitted}</td><td>${m.resolved}</td></tr>`).join('')}
        </tbody></table>
        <div class="section-title">Top Community-Engaged Issues</div>
        <table><thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Upvotes</th><th>Bumps</th><th>Status</th></tr></thead><tbody>
          ${topEngaged.map(t => `<tr><td>#${t.id}</td><td>${t.title}</td><td>${t.category}</td><td>${t.upvotes}</td><td>${t.bumps}</td><td>${(t.status || '').replace('_', ' ').toUpperCase()}</td></tr>`).join('')}
        </tbody></table>
        <div class="footer"><p><strong>CityZen Admin Analytics System</strong></p><p>Automatically generated report. Data is current as of ${new Date().toLocaleString()}</p></div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Admin Analytics Report' });
      }
      setShowExportModal(false);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, darkMode && styles.textGray]}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, darkMode && styles.containerDark]}>
        <AlertCircle size={40} color={COLORS.danger} />
        <Text style={[styles.errorText, darkMode && { color: '#FCA5A5' }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchAnalytics()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.containerDark]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
            <ArrowLeft size={22} color={darkMode ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerSubtitle, darkMode && styles.textGray]}>System-Wide</Text>
            <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>Admin Analytics</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowExportModal(true)} style={[styles.exportIcon, darkMode && styles.exportIconDark]}>
          <Download size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════
          KPI CARDS
          ═══════════════════════════════════════════════════ */}
      <View style={styles.kpiGrid}>
        <KPICard label="Total Cases" value={summary.total} icon={Target} color={COLORS.primary} darkMode={darkMode} />
        <KPICard label="Resolved" value={summary.resolved} icon={CheckCircle} color={COLORS.success} darkMode={darkMode} />
        <KPICard label="Pending" value={summary.pending} icon={Clock} color={COLORS.warning} darkMode={darkMode} />
        <KPICard label="Appeals" value={summary.appealed} icon={Shield} color={COLORS.danger} darkMode={darkMode} />
        <KPICard label="Escalated" value={summary.escalated} icon={Zap} color={COLORS.orange} darkMode={darkMode} />
        <KPICard label="Critical" value={summary.criticalFailures} icon={AlertCircle} color={COLORS.rose} darkMode={darkMode} />
      </View>

      {/* Secondary KPI Row */}
      <View style={styles.secondaryKpiRow}>
        <View style={[styles.secondaryKpiCard, darkMode && styles.secondaryKpiCardDark]}>
          <Activity size={18} color={COLORS.success} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.secondaryKpiLabel, darkMode && styles.textGray]}>Service Health</Text>
            <Text style={[styles.secondaryKpiValue, darkMode && styles.textWhite]}>{summary.serviceHealth || 0}%</Text>
          </View>
        </View>
        <View style={[styles.secondaryKpiCard, darkMode && styles.secondaryKpiCardDark]}>
          <TrendingUp size={18} color={COLORS.primary} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.secondaryKpiLabel, darkMode && styles.textGray]}>Avg Resolution</Text>
            <Text style={[styles.secondaryKpiValue, darkMode && styles.textWhite]}>{summary.avgResolutionHrs || 0}h</Text>
          </View>
        </View>
      </View>
      <View style={styles.secondaryKpiRow}>
        <View style={[styles.secondaryKpiCard, darkMode && styles.secondaryKpiCardDark]}>
          <Award size={18} color={COLORS.warning} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.secondaryKpiLabel, darkMode && styles.textGray]}>Citizen Rating</Text>
            <Text style={[styles.secondaryKpiValue, darkMode && styles.textWhite]}>{summary.avgRating || 0}/5.0 ★</Text>
          </View>
        </View>
        <View style={[styles.secondaryKpiCard, darkMode && styles.secondaryKpiCardDark, styles.warningKpi]}>
          <AlertCircle size={18} color={COLORS.danger} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.secondaryKpiLabel, darkMode ? styles.warningTextDark : styles.warningTextLight]}>Deadline Miss Rate</Text>
            <Text style={[styles.secondaryKpiValue, darkMode ? styles.warningTextDark : styles.warningTextLight]}>{summary.deadlineMissRate || 0}%</Text>
          </View>
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════
          MOST AFFECTED CATEGORY (KPI HIGHLIGHT)
          ═══════════════════════════════════════════════════ */}
      {mostAffected && (
        <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Target size={18} color={COLORS.danger} />
              <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Most Affected Area</Text>
            </View>
          </View>
          <View style={[styles.highlightCard, darkMode && styles.highlightCardDark]}>
            <View style={styles.highlightRow}>
              <View style={[styles.highlightBadge, { backgroundColor: COLORS.danger + '20' }]}>
                <Text style={[styles.highlightBadgeText, { color: COLORS.danger }]}>#1</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.highlightName, darkMode && styles.textWhite]}>{mostAffected.name}</Text>
                <Text style={[styles.highlightSub, darkMode && styles.textGray]}>
                  {mostAffected.total} total complaints • {mostAffected.resolved} resolved • {mostAffected.pending} pending
                </Text>
              </View>
              <View style={styles.highlightCount}>
                <Text style={[styles.highlightCountText, { color: COLORS.danger }]}>{mostAffected.total}</Text>
              </View>
            </View>
            {/* Mini progress */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarTrack, darkMode && { backgroundColor: '#374151' }]}>
                <View style={[styles.progressBarFill, { width: `${mostAffected.total > 0 ? (mostAffected.resolved / mostAffected.total) * 100 : 0}%`, backgroundColor: COLORS.success }]} />
              </View>
              <Text style={[styles.progressLabel, darkMode && styles.textGray]}>
                {mostAffected.total > 0 ? Math.round((mostAffected.resolved / mostAffected.total) * 100) : 0}% resolved
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          STATUS BREAKDOWN CHART
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <BarChart3 size={18} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Status Breakdown</Text>
          </View>
          <TouchableOpacity onPress={() => setShowChart(!showChart)}>
            <Text style={styles.toggleText}>{showChart ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {showChart && (
          <BarChart
            data={statusChartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={themedChartConfig}
            style={styles.chartStyle}
            fromZero
            showValuesOnTopOfBars
          />
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          MONTHLY TRENDS CHART
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <TrendingUp size={18} color={COLORS.success} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Monthly Trends</Text>
          </View>
          <TouchableOpacity onPress={() => setShowTrendChart(!showTrendChart)}>
            <Text style={styles.toggleText}>{showTrendChart ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {showTrendChart && monthlyTrends.length > 0 && (
          <BarChart
            data={trendChartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={trendChartConfig}
            style={styles.chartStyle}
            fromZero
            showValuesOnTopOfBars
          />
        )}
        {showTrendChart && (
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.legendText, darkMode && styles.textGray]}>Submissions</Text>
            </View>
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          RESOLUTION TIME DISTRIBUTION
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Clock size={18} color={COLORS.purple} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Resolution Time Distribution</Text>
          </View>
          <TouchableOpacity onPress={() => setShowResolutionChart(!showResolutionChart)}>
            <Text style={styles.toggleText}>{showResolutionChart ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {showResolutionChart && (
          <BarChart
            data={resolutionChartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={resolutionChartConfig}
            style={styles.chartStyle}
            fromZero
            showValuesOnTopOfBars
          />
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          CATEGORY BREAKDOWN TABLE
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <TouchableOpacity onPress={() => setShowCategoryDetail(!showCategoryDetail)} style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Target size={18} color={COLORS.orange} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Category Breakdown</Text>
          </View>
          {showCategoryDetail
            ? <ChevronUp size={20} color={darkMode ? '#9CA3AF' : '#6B7280'} />
            : <ChevronDown size={20} color={darkMode ? '#9CA3AF' : '#6B7280'} />
          }
        </TouchableOpacity>
        {showCategoryDetail && categoryBreakdown.map((cat, idx) => (
          <View key={cat.id || idx} style={[styles.tableRow, darkMode && styles.tableRowDark, idx === 0 && styles.tableRowFirst]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tableName, darkMode && styles.textWhite]}>{cat.name}</Text>
              <View style={styles.tableChipsRow}>
                <StatChip label="Total" value={cat.total} color={COLORS.primary} />
                <StatChip label="Resolved" value={cat.resolved} color={COLORS.success} />
                <StatChip label="Pending" value={cat.pending} color={COLORS.warning} />
                {cat.critical > 0 && <StatChip label="Critical" value={cat.critical} color={COLORS.danger} />}
              </View>
            </View>
            {/* Progress */}
            <View style={styles.tableProgress}>
              <Text style={[styles.tablePercent, { color: cat.total > 0 ? COLORS.success : '#9CA3AF' }]}>
                {cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0}%
              </Text>
              <View style={[styles.miniProgress, darkMode && { backgroundColor: '#374151' }]}>
                <View style={[styles.miniProgressFill, { width: `${cat.total > 0 ? (cat.resolved / cat.total) * 100 : 0}%`, backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>
        ))}
        {!showCategoryDetail && categoryBreakdown.length > 0 && (
          <Text style={[styles.tapHint, darkMode && styles.textGray]}>Tap to expand • {categoryBreakdown.length} categories</Text>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          DEPARTMENT PERFORMANCE TABLE
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <TouchableOpacity onPress={() => setShowDeptDetail(!showDeptDetail)} style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Users size={18} color={COLORS.indigo} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Department Performance</Text>
          </View>
          {showDeptDetail
            ? <ChevronUp size={20} color={darkMode ? '#9CA3AF' : '#6B7280'} />
            : <ChevronDown size={20} color={darkMode ? '#9CA3AF' : '#6B7280'} />
          }
        </TouchableOpacity>
        {showDeptDetail && deptPerformance.map((dept, idx) => (
          <View key={dept.id || idx} style={[styles.tableRow, darkMode && styles.tableRowDark, idx === 0 && styles.tableRowFirst]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tableName, darkMode && styles.textWhite]} numberOfLines={1}>{dept.name}</Text>
              <View style={styles.tableChipsRow}>
                <StatChip label="Active" value={dept.active} color={COLORS.primary} />
                <StatChip label="Resolved" value={dept.resolved} color={COLORS.success} />
                {dept.critical > 0 && <StatChip label="Critical" value={dept.critical} color={COLORS.danger} />}
              </View>
            </View>
            <View style={styles.tableProgress}>
              <Text style={[styles.tablePercent, { color: dept.performance != null ? COLORS.success : '#9CA3AF' }]}>
                {dept.performance != null ? `${dept.performance}%` : 'N/A'}
              </Text>
              <View style={[styles.miniProgress, darkMode && { backgroundColor: '#374151' }]}>
                <View style={[styles.miniProgressFill, { width: `${dept.performance || 0}%`, backgroundColor: dept.performance != null ? COLORS.success : '#9CA3AF' }]} />
              </View>
            </View>
          </View>
        ))}
        {!showDeptDetail && deptPerformance.length > 0 && (
          <Text style={[styles.tapHint, darkMode && styles.textGray]}>Tap to expand • {deptPerformance.length} departments</Text>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          TOP COMMUNITY-ENGAGED ISSUES
          ═══════════════════════════════════════════════════ */}
      {topEngaged.length > 0 && (
        <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Zap size={18} color={COLORS.warning} />
              <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Top Community Issues</Text>
            </View>
          </View>
          {topEngaged.slice(0, 5).map((item, idx) => (
            <View key={item.id} style={[styles.engagedRow, darkMode && styles.engagedRowDark]}>
              <View style={[styles.engagedRank, { backgroundColor: idx === 0 ? COLORS.warning + '20' : darkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Text style={[styles.engagedRankText, { color: idx === 0 ? COLORS.warning : darkMode ? '#D1D5DB' : '#6B7280' }]}>#{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.engagedTitle, darkMode && styles.textWhite]} numberOfLines={1}>#{item.id} {item.title}</Text>
                <Text style={[styles.engagedMeta, darkMode && styles.textGray]}>{item.category}</Text>
              </View>
              <View style={styles.engagedStats}>
                <Text style={[styles.engagedStatVal, { color: COLORS.primary }]}>↑{item.upvotes}</Text>
                <Text style={[styles.engagedStatVal, { color: COLORS.orange }]}>⚡{item.bumps}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#9CA3AF') + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[item.status] || '#9CA3AF' }]}>
                  {(item.status || '').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          COMPLAINT HEATMAP
          ═══════════════════════════════════════════════════ */}
      <View style={[styles.sectionCard, darkMode && styles.sectionCardDark]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <MapIcon size={18} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Complaint Heatmap</Text>
          </View>
          <TouchableOpacity onPress={() => setShowMap(!showMap)}>
            <Text style={styles.toggleText}>{showMap ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {showMap && (
          <View style={styles.mapFilterRow}>
            {MAP_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.mapFilterChip, darkMode && styles.mapFilterChipDark, mapFilter === f.key && styles.mapFilterChipActive]}
                onPress={() => setMapFilter(f.key)}
              >
                <Text style={[styles.mapFilterText, darkMode && styles.mapFilterTextDark, mapFilter === f.key && styles.mapFilterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showMap && (
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
            >
              {heatmapData.length > 0 && (
                <Heatmap points={heatmapData} radius={42} opacity={0.75} />
              )}
              {filteredHeatmapPoints.map((point, index) => (
                <Marker
                  key={`${point.id}-${index}`}
                  coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                  pinColor={STATUS_COLORS[point.status] || COLORS.primary}
                  title={`#${point.id} ${point.title}`}
                  description={`${point.category} • ${(point.status || '').replace('_', ' ')}`}
                />
              ))}
            </MapView>
            {filteredHeatmapPoints.length === 0 && (
              <View style={[styles.mapEmpty, darkMode && styles.mapEmptyDark]}>
                <Text style={[styles.mapEmptyText, darkMode && styles.textGray]}>No complaints match this filter.</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════
          EXPORT MODAL
          ═══════════════════════════════════════════════════ */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Export Report</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <X size={24} color={darkMode ? '#F9FAFB' : '#374151'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, darkMode && styles.textGray]}>
              Generate a comprehensive PDF report with all analytics data including KPIs, category breakdown, department performance, monthly trends, and top community issues.
            </Text>
            <TouchableOpacity style={styles.exportFullButton} onPress={generatePDF}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Download size={20} color="white" />
                <Text style={styles.exportFullButtonText}>Generate PDF Report</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════

const KPICard = ({ label, value, icon: Icon, color, darkMode }) => (
  <View style={[styles.kpiCard, darkMode && styles.kpiCardDark, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Icon size={14} color={color} />
      <Text style={[styles.kpiLabel, darkMode && styles.kpiLabelDark, { marginLeft: 4 }]}>{label}</Text>
    </View>
    <Text style={[styles.kpiValue, darkMode && styles.kpiValueDark]}>{value ?? 0}</Text>
  </View>
);

const StatChip = ({ label, value, color }) => (
  <View style={[styles.statChip, { backgroundColor: color + '15' }]}>
    <Text style={[styles.statChipText, { color }]}>{label}: {value}</Text>
  </View>
);

// ═══════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  containerDark: { backgroundColor: '#030712' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { marginTop: 12, fontSize: 16, color: '#EF4444', fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
  retryButton: { marginTop: 16, backgroundColor: '#1E88E5', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  retryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFF',
  },
  headerDark: { backgroundColor: '#111827' },
  backButton: { padding: 6, marginRight: 12 },
  headerSubtitle: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  exportIcon: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 12 },
  exportIconDark: { backgroundColor: '#1E3A5F' },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, paddingBottom: 4, justifyContent: 'space-between' },
  kpiCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, width: '48%', marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 }
    }),
  },
  kpiCardDark: { backgroundColor: '#111827' },
  kpiLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  kpiLabelDark: { color: '#9CA3AF' },
  kpiValue: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  kpiValueDark: { color: '#F9FAFB' },

  // Secondary KPI
  secondaryKpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 6 },
  secondaryKpiCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 }
    }),
  },
  secondaryKpiCardDark: { backgroundColor: '#111827', borderColor: '#374151' },
  secondaryKpiLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  secondaryKpiValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  warningKpi: { borderLeftWidth: 3, borderLeftColor: '#DC2626' },
  warningTextLight: { color: '#DC2626' },
  warningTextDark: { color: '#FCA5A5' },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    }),
  },
  sectionCardDark: { backgroundColor: '#111827' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  toggleText: { fontSize: 12, color: '#1E88E5', fontWeight: '600' },

  // Highlight Card (Most Affected)
  highlightCard: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14 },
  highlightCardDark: { backgroundColor: '#2D1B1B' },
  highlightRow: { flexDirection: 'row', alignItems: 'center' },
  highlightBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  highlightBadgeText: { fontWeight: '800', fontSize: 14 },
  highlightName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  highlightSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  highlightCount: { alignItems: 'center' },
  highlightCountText: { fontSize: 24, fontWeight: '800' },
  progressBarContainer: { marginTop: 10 },
  progressBarTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'right' },

  // Charts
  chartStyle: { marginLeft: -16, borderRadius: 16 },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6B7280' },

  // Tables
  tableRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' },
  tableRowDark: { borderTopColor: '#1F2937' },
  tableRowFirst: { borderTopWidth: 0 },
  tableName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  tableChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statChipText: { fontSize: 10, fontWeight: '700' },
  tableProgress: { alignItems: 'flex-end', marginLeft: 10, width: 60 },
  tablePercent: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  miniProgress: { height: 4, width: 50, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  tapHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },

  // Engaged list
  engagedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  engagedRowDark: { borderTopColor: '#1F2937' },
  engagedRank: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  engagedRankText: { fontWeight: '800', fontSize: 12 },
  engagedTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  engagedMeta: { fontSize: 11, color: '#6B7280' },
  engagedStats: { flexDirection: 'row', gap: 6, marginRight: 8 },
  engagedStatVal: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },

  // Map
  mapFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  mapFilterChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  mapFilterChipDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  mapFilterChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  mapFilterText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  mapFilterTextDark: { color: '#D1D5DB' },
  mapFilterTextActive: { color: '#FFF' },
  mapWrapper: { height: 240, borderRadius: 12, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  mapEmpty: {
    position: 'absolute', left: 12, right: 12, bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  mapEmptyDark: { backgroundColor: 'rgba(17, 24, 39, 0.92)' },
  mapEmptyText: { color: '#6B7280', fontSize: 12, textAlign: 'center', fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 },
  modalContentDark: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalText: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  exportFullButton: { backgroundColor: '#1E88E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  exportFullButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Text helpers
  textWhite: { color: '#F9FAFB' },
  textGray: { color: '#9CA3AF' },
});
