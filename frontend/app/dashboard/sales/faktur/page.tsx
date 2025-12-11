'use client';

import FakturView from '@/components/views/sales/FakturView';

export default function InvoicesPage() {
  // Logic is now in FakturView, managed by DashboardLayout -> ViewManager.
  // This page file is technically still rendered by Next.js router,
  // but if we use ViewManager in Layout, we might not render {children}.
  // IF we render children, we should render FakturView here.

  // STRATEGY:
  // If we are fully switching to ViewManager in DashboardLayout,
  // `children` in Layout will be IGNORED for registered views.
  // So this file might not even need to render anything if the Layout handles it.
  // BUT, to be safe and allow standard mounting if ViewManager fails or logic differs:
  return <FakturView />;
}
