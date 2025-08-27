import React from 'react';
import LandingPage from '../src/components/LandingPageComponents/LandingPage';
type Props = {};

const IndexPage: React.FC<Props> = () => {
  return (
    <LandingPage />
  );
};

export async function getStaticProps() {
  return { props: {} };
}

export default IndexPage;
