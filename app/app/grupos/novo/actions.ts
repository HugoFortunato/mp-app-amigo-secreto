'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export type CreateGroupState = {
  success: null | boolean;
  message?: string;
};

export async function createGroup(
  _previousState: CreateGroupState,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: authUser, error: authError } = await supabase.auth.getUser();

  if (authError) {
    return {
      success: false,
      message: authError.message,
    };
  }

  const names = formData.getAll('name');
  const email = formData.getAll('email');
  const groupName = formData.get('group-name');

  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: groupName,
      owner_id: authUser?.user?.id,
    })
    .select()
    .single();

  if (groupError) {
    return {
      success: false,
      message: 'Ocorreu um erro ao criar o grupo. Por favor tente novamente',
    };
  }

  const participants = names.map((name, index) => ({
    name,
    email: email[index],
    group_id: newGroup?.id,
  }));

  const { data: createdParticipants, error: participantError } = await supabase
    .from('participants')
    .insert(participants)
    .select();

  if (participantError) {
    return {
      success: false,
      message:
        'Ocorreu um erro ao adicionar os participantes ao grupo. Por favor tente novamente',
    };
  }

  const drawnParticipants = drawGroup(createdParticipants);

  const { error: errorDraw } = await supabase
    .from('participants')
    .upsert(drawnParticipants);

  if (errorDraw) {
    return {
      success: false,
      message:
        'Ocorreu um erro ao sortear um participante do grupo. Por favor tente novamente',
    };
  }

  redirect(`/app/grupos/${newGroup.id}`);

  //   return {
  //     success: true,
  //     message: 'Grupo criado com sucesso',
  //     participants: drawnParticipants,
  //   };
}

type Participant = {
  id: string;
  group_id: string;
  name: string;
  email: string;
  assigned_to: string | null;
  created_at: string;
};

function drawGroup(participants: Participant[]) {
  const selectedParticipants: string[] = [];

  return participants.map((participant) => {
    const availableParticipants = participants.filter(
      (p) => p.id !== participant.id && !selectedParticipants.includes(p.id)
    );

    const assignedParticipant =
      availableParticipants[
        Math.floor(Math.random() * availableParticipants.length)
      ];

    selectedParticipants.push(assignedParticipant.id);

    return {
      ...participant,
      assigned_to: assignedParticipant.id,
    };
  });
}
