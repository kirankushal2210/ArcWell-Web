import { Inbox } from "@/components/Inbox";
import { PageTitle } from "@/components/ui";
import { CLIENTS, MESSAGES } from "@/lib/data";

export default function MessagesPage() {
  return (
    <>
      <PageTitle title="Messages" sub="One inbox for every client conversation" />
      <Inbox messages={MESSAGES} clients={CLIENTS} />
    </>
  );
}
