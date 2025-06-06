import NewGroupForm from '@/components/new-group-form';
import { createClient } from '@/utils/supabase/server';

export default async function NewGroupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const loggedUser = {
    id: data?.user?.id,
    email: data?.user?.email,
  };

  return (
    <div className="mt-40">
      <NewGroupForm loggedUser={loggedUser} />
    </div>
  );
}
