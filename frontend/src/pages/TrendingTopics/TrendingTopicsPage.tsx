import React from 'react';
import TrendingTopics from '../../components/TrendingTopics';
import styles from './TrendingTopicsPage.module.css';

const TrendingTopicsPage: React.FC = () => {
  return (
    <div className={styles.trendingTopicsPageContainer}>
      <TrendingTopics region="pakistan" />
    </div>
  );
};

export default TrendingTopicsPage;
