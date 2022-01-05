import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import map from 'lodash/map';
import { components as vizComponents } from '@tidepool/viz';
import { useLocalStorage } from '../../core/hooks';

const { Stat } = vizComponents;

export const readableStatName = statId => ({
  readingsInRange: 'Readings in range',
  timeInAuto: 'Time in automation',
  timeInOverride: 'Time in activity',
  timeInRange: 'Time in range',
  totalInsulin: 'Insulin ratio',
}[statId] || statId);

export const readableChartName = chartType => ({
  basics: 'Basics',
  bgLog: 'BG log',
  daily: 'Daily',
  trends: 'Trends',
}[chartType] || chartType);

const Stats = (props) => {
  const {
    bgPrefs,
    chartPrefs,
    chartType,
    persistState,
    stats,
    trackMetric,
  } = props;

  const [statsCollapsedState, setStatsCollapsedState] = useLocalStorage('statsCollapsedState', {});

  function handleCollapse (id, collapsed) {
    if (persistState) {
      setStatsCollapsedState({
        ...statsCollapsedState,
        [chartType]: {
          ...statsCollapsedState[chartType],
          [id]: collapsed,
        }
      });

      trackMetric(`Click ${collapsed ? 'collapsed' : 'expanded'} - ${readableChartName(chartType)} - ${readableStatName(id)}`);
    }
  }

  return (
    <div className="Stats">
      {map(stats, stat => (
        <div id={`Stat--${stat.id}`} key={stat.id}>
          <Stat
            animate={chartPrefs.animateStats}
            bgPrefs={bgPrefs}
            onCollapse={handleCollapse.bind(null, stat.id)}
            isOpened={stat.collapsible ? !statsCollapsedState[chartType]?.[stat.id] : true}
            {...stat}
            title={stat.collapsible && statsCollapsedState[chartType]?.[stat.id]
              ? get(stat, 'collapsedTitle', stat.title)
              : stat.title
            }
          />
        </div>
      ))}
    </div>
  );
}

Stats.propTypes = {
  bgPrefs: PropTypes.object.isRequired,
  chartPrefs: PropTypes.object.isRequired,
  chartType: PropTypes.string,
  persistState: PropTypes.bool,
  stats: PropTypes.array.isRequired,
  trackMetric: PropTypes.func.isRequired,
};

Stats.defaultProps = {
  persistState: true,
};

export default Stats;
