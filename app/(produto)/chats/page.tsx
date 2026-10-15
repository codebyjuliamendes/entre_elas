import { ChatsScreen } from "@/components/demo/ChatsScreen";
export default async function Chats({
  searchParams,
}: {
  searchParams: Promise<{ com?: string }>;
}) {
  const { com } = await searchParams;
  return <ChatsScreen com={com} />;
}
