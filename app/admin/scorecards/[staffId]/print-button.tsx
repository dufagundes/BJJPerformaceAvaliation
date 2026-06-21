"use client";

import { Button } from "../../../../components/ui/button";

export default function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      Print / Export
    </Button>
  );
}