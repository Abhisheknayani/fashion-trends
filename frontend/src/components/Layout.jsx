import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <>
      <Header />

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div>
          <b>FASHION TRENDS</b>
          <p>
            Modern fashion. Thoughtful design.
            Fast delivery.
          </p>
        </div>

        <div>
          <b>Customer Care</b>
          <p>
            Track order · Returns · Help center
          </p>
        </div>

        <div>
          <b>Secure shopping</b>
          <p>
            Encrypted checkout · Trusted payments
          </p>
        </div>
      </footer>
    </>
  );
}