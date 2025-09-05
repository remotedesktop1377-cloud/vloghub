import React from 'react';
import styles from './LoadingOverlay.module.css';

const AppLoadingOverlay: React.FC = () => {

    return (
        <div className={styles.overlay}>
            <div className={styles.loader}></div>
        </div>
    );
};

export default AppLoadingOverlay;