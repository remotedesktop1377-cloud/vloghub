import React from 'react';
import TrendingTopics from '../../components/TrendingTopics/TrendingTopics';
import styles from './TrendingTopicsPage.module.css';

const TrendingTopicsPage: React.FC = () => {
  return (
    <div className={styles.trendingTopicsPageContainer}>
      <TrendingTopics />
    </div>
  );
};

export default TrendingTopicsPage;
