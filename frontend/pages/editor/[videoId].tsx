import React from 'react';
import { useRouter } from 'next/router';
import ClipEditor from '../../src/pages/ClipEditor/ClipEditor';

export default function EditorPage() {
  const router = useRouter();
  const { videoId } = router.query;

  if (!videoId || typeof videoId !== 'string') {
    return <div>Loading...</div>;
  }

  return <ClipEditor />;
}
