"use client";

import { Button } from "./ui";
import { Icon } from "./icons";

/** Opens the browser's print dialog, where "Save as PDF" produces the report file. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Icon name="send" size={14} /> Print or save as PDF
    </Button>
  );
}
