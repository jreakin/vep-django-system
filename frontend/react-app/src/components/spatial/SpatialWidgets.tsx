import React from 'react';
import {
  AttachMoney,
  People,
  ContactPhone,
  TrendingUp,
} from '@mui/icons-material';
import SpatialMetricWidget from './SpatialMetricWidget';
import { DashboardStats } from '../../services/dashboard';

export interface FundsRaisedWidgetProps {
  value: number;
  target?: number;
  onRefresh?: () => Promise<void>;
}

export const FundsRaisedWidget: React.FC<FundsRaisedWidgetProps> = ({
  value,
  target,
  onRefresh
}) => {
  const percentage = target ? Math.round((value / target) * 100) : 0;
  const subtitle = target ? `${percentage}% of $${target.toLocaleString()} goal` : undefined;
  
  const additionalData = target ? [
    { label: 'Target', value: `$${target.toLocaleString()}` },
    { label: 'Remaining', value: `$${Math.max(0, target - value).toLocaleString()}` },
    { label: 'Progress', value: `${percentage}%` }
  ] : undefined;

  return (
    <SpatialMetricWidget
      title="Funds Raised"
      value={value}
      unit="$"
      icon={<AttachMoney fontSize="large" />}
      color="#4caf50"
      subtitle={subtitle}
      data={additionalData}
      onRefresh={onRefresh}
      className="funds-raised-widget"
    />
  );
};

export interface VoterContactsWidgetProps {
  value: number;
  thisWeek?: number;
  onRefresh?: () => Promise<void>;
}

export const VoterContactsWidget: React.FC<VoterContactsWidgetProps> = ({
  value,
  thisWeek,
  onRefresh
}) => {
  const subtitle = thisWeek ? `${thisWeek} contacts this week` : undefined;
  
  const additionalData = thisWeek ? [
    { label: 'This Week', value: thisWeek.toLocaleString() },
    { label: 'Daily Avg', value: Math.round(thisWeek / 7).toLocaleString() },
    { label: 'Weekly Goal', value: 'N/A' }
  ] : undefined;

  return (
    <SpatialMetricWidget
      title="Voter Contacts"
      value={value}
      icon={<ContactPhone fontSize="large" />}
      color="#2196f3"
      subtitle={subtitle}
      data={additionalData}
      onRefresh={onRefresh}
      className="voter-contacts-widget"
    />
  );
};

export interface TotalVotersWidgetProps {
  value: number;
  registered?: number;
  likely?: number;
  onRefresh?: () => Promise<void>;
}

export const TotalVotersWidget: React.FC<TotalVotersWidgetProps> = ({
  value,
  registered,
  likely,
  onRefresh
}) => {
  const subtitle = registered ? `${registered.toLocaleString()} registered` : undefined;
  
  const additionalData = registered ? [
    { label: 'Registered', value: registered.toLocaleString() },
    { label: 'Likely', value: likely ? likely.toLocaleString() : 'N/A' },
    { label: 'Turnout Rate', value: likely ? `${Math.round((likely / registered) * 100)}%` : 'N/A' }
  ] : undefined;

  return (
    <SpatialMetricWidget
      title="Total Voters"
      value={value}
      icon={<People fontSize="large" />}
      color="#ff9800"
      subtitle={subtitle}
      data={additionalData}
      onRefresh={onRefresh}
      className="total-voters-widget"
    />
  );
};

export interface ChartsCreatedWidgetProps {
  value: number;
  thisMonth?: number;
  onRefresh?: () => Promise<void>;
}

export const ChartsCreatedWidget: React.FC<ChartsCreatedWidgetProps> = ({
  value,
  thisMonth,
  onRefresh
}) => {
  const subtitle = thisMonth ? `${thisMonth} created this month` : undefined;
  
  const additionalData = thisMonth ? [
    { label: 'This Month', value: thisMonth.toString() },
    { label: 'Last Month', value: 'N/A' },
    { label: 'Growth', value: 'N/A' }
  ] : undefined;

  return (
    <SpatialMetricWidget
      title="Charts Created"
      value={value}
      icon={<TrendingUp fontSize="large" />}
      color="#9c27b0"
      subtitle={subtitle}
      data={additionalData}
      onRefresh={onRefresh}
      className="charts-created-widget"
    />
  );
};

// Convenience component that creates spatial widgets from dashboard stats
export interface DashboardSpatialWidgetsProps {
  stats: DashboardStats;
  onRefreshStats?: () => Promise<void>;
  fundsRaised?: number;
  fundsTarget?: number;
  voterContacts?: number;
  voterContactsThisWeek?: number;
  registeredVoters?: number;
  likelyVoters?: number;
  chartsThisMonth?: number;
}

export const DashboardSpatialWidgets: React.FC<DashboardSpatialWidgetsProps> = ({
  stats,
  onRefreshStats,
  fundsRaised = 0,
  fundsTarget,
  voterContacts = 0,
  voterContactsThisWeek,
  registeredVoters,
  likelyVoters,
  chartsThisMonth
}) => {
  return (
    <>
      <FundsRaisedWidget
        value={fundsRaised}
        target={fundsTarget}
        onRefresh={onRefreshStats}
      />
      
      <VoterContactsWidget
        value={voterContacts}
        thisWeek={voterContactsThisWeek}
        onRefresh={onRefreshStats}
      />
      
      <TotalVotersWidget
        value={stats.total_voters || 0}
        registered={registeredVoters}
        likely={likelyVoters}
        onRefresh={onRefreshStats}
      />
      
      <ChartsCreatedWidget
        value={stats.charts_count}
        thisMonth={chartsThisMonth}
        onRefresh={onRefreshStats}
      />
    </>
  );
};

export default {
  FundsRaisedWidget,
  VoterContactsWidget,
  TotalVotersWidget,
  ChartsCreatedWidget,
  DashboardSpatialWidgets
};