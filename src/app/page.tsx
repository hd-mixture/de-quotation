import { Suspense } from "react";
import LayoutClient from './LayoutClient';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LayoutClient />
    </Suspense>
  );
}
