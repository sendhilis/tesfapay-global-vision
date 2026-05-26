import { Outlet } from 'react-router-dom';
import { MerchantWalletProvider } from '@/contexts/MerchantWalletContext';
import NisirAIWidget from '@/components/NisirAIWidget';

const MerchantLayout = () => (
  <MerchantWalletProvider>
    <Outlet />
    <NisirAIWidget portal="merchant" />
  </MerchantWalletProvider>
);

export default MerchantLayout;
