import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.statusCode = 302;
  res.setHeader('Location', '/search');
  return { props: {} };
};

export default function EditorIndexRedirect() {
  return null;
}
