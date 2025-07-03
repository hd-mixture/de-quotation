import { Suspense } from "react";
import LayoutClient from './LayoutClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LayoutClient />
    </Suspense>
  );
}
