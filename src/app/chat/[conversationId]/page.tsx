import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { ChatPage } from '@/components/chat/chat-page';

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  await connectMongoDB();
  const conversation = await Conversation.findOne({
    _id: params.conversationId,
    userId: session.user.id,
  }).lean();

  if (!conversation) redirect('/chat');

  return (
    <ChatPage
      conversationId={params.conversationId}
      initialMessages={(conversation as any).messages || []}
    />
  );
}
