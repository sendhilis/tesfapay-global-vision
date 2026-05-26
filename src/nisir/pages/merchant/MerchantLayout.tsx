import { Outlet } from 'react-router-dom';
import { MerchantWalletProvider } from '@nisir/contexts/MerchantWalletContext';
import NisirAIWidget from '@nisir/components/NisirAIWidget';

const MerchantLayout = () => (
  <MerchantWalletProvider>
    <Outlet />
    <NisirAIWidget portal="merchant" />
  </MerchantWalletProvider>
);

export default MerchantLayout;
