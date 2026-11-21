import { CheckInReview } from "@/components/CheckInReview";
import { PageTitle } from "@/components/ui";
import { CHECK_INS, CLIENTS } from "@/lib/data";

export const metadata = { title: "Progress — Arcwell" };

export default function CheckInsPage() {
  const waiting = CHECK_INS.filter((k) => !k.reviewed).length;
  return (
    <>
      <PageTitle title="Progress" sub={`${waiting} check-ins waiting · oldest first · press ? for shortcuts`} />
      <CheckInReview checkIns={CHECK_INS} clients={CLIENTS} />
    </>
  );
}
