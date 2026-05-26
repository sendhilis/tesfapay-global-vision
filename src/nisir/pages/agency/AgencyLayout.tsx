import { Outlet } from 'react-router-dom';
import NisirAIWidget from '@/components/NisirAIWidget';

const AgencyLayout = () => (
  <>
    <Outlet />
    <NisirAIWidget portal="agency" />
  </>
);

export default AgencyLayout;
