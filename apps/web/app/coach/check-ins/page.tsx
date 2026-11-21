import { CheckInReview } from "@/components/CheckInReview";
import { PageTitle } from "@/components/ui";
import { CHECK_INS } from "@/lib/data";

export default function CheckInsPage() {
  const queue = [...CHECK_INS].sort((a, b) => Number(a.reviewed) - Number(b.reviewed));
  return (
    <>
      <PageTitle
        title="Progress"
        sub={`${queue.filter((k) => !k.reviewed).length} check-ins waiting · oldest first`}
      />
      <CheckInReview checkIns={queue} />
    </>
  );
}
