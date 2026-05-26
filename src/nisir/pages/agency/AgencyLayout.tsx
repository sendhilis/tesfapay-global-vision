import { Outlet } from 'react-router-dom';
import NisirAIWidget from '@nisir/components/NisirAIWidget';

const AgencyLayout = () => (
  <>
    <Outlet />
    <NisirAIWidget portal="agency" />
  </>
);

export default AgencyLayout;
