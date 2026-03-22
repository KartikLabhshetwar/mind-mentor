import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { connectMongoDB } from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { ChatLayout } from '@/components/chat/chat-layout';

export default async function ChatRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  await connectMongoDB();
  const conversations = await Conversation.find({ userId: session.user.id })
    .select('title createdAt')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const serialized = conversations.map((c: any) => ({
    _id: c._id.toString(),
    title: c.title,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <SidebarProvider>
      <ChatLayout conversations={serialized}>
        {children}
      </ChatLayout>
    </SidebarProvider>
  );
}
