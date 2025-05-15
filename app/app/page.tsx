import { redirect } from 'next/navigation';

export default async function AppPage() {
  return redirect('/app/grupos');
}
