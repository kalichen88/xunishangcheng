import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CartProvider } from '@/components/CartProvider';
import { ToastProvider } from '@/components/Toast';
import { Home } from '@/pages/Home';
import { Services } from '@/pages/Services';
import { ServiceDetail } from '@/pages/ServiceDetail';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { OrderDetail } from '@/pages/OrderDetail';
import { Orders } from '@/pages/Orders';
import { Admin } from '@/pages/Admin';
import { Faq } from '@/pages/Faq';
import { Legal } from '@/pages/Legal';
import { NotFound } from '@/pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="service/:id" element={<ServiceDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:id" element={<OrderDetail />} />
              <Route path="orders" element={<Orders />} />
              <Route path="admin" element={<Admin />} />
              <Route path="faq" element={<Faq />} />
              <Route path="terms" element={<Legal kind="terms" />} />
              <Route path="privacy" element={<Legal kind="privacy" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
