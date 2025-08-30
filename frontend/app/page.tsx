import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to trending topics page
  redirect('/trending-topics')
}

